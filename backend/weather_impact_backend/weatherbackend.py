import subprocess
import time
import threading
import sys
import os
import requests
import signal

class WindFarmAPILauncher:
    """
    Unified launcher for all Wind Farm APIs
    Manages multiple backend services with proper port allocation and error detection
    """
    
    def __init__(self):
        self.processes = {}
        self.api_configs = {
            'wind_speed': {
                'file': 'WindSpeed/Windspeed.py',
                'port': 5000,
                'name': 'Wind Speed Power Loss API',
                'description': 'Low/High wind speed power loss detection',
                'health_endpoint': '/api/health'
            },
            'wind_direction': {
                'file': 'WindDirection/WindDirection.py',
                'port': 8000,
                'name': 'Wind Direction Power Loss API',
                'description': 'Wind direction repositioning power loss',
                'health_endpoint': '/api/health'
            },
            'lightning': {
                'file': 'Lightning/lightning_backend.py',
                'port': 5001,
                'name': 'Lightning Risk Assessment API',
                'description': '6-hour lightning risk forecasting',
                'health_endpoint': '/health'
            },
            'real_time_turbines': {
                'file': 'PowerForecast/app.py',
                'port': 5002,
                'name': 'Real-Time Turbine Monitoring API',
                'description': 'Live turbine performance monitoring',
                'health_endpoint': '/api/status'
            }
        }
        
        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
    
    def signal_handler(self, sig, frame):
        """Handle shutdown signals gracefully"""
        print("\n🛑 Shutdown signal received. Stopping all APIs...")
        self.stop_all_apis()
        sys.exit(0)
    
    def check_file_exists(self, file_path):
        """Check if the API file exists"""
        return os.path.exists(file_path)
    
    def modify_app_py_port(self):
        """Modify PowerForecast/app.py to use port 5002 instead of 5000"""
        try:
            app_path = 'PowerForecast/app.py'
            if os.path.exists(app_path):
                with open(app_path, 'r') as file:
                    content = file.read()
                
                # Check if already modified
                if 'port=5002' in content or 'host="0.0.0.0", port=5002' in content:
                    print("✅ PowerForecast/app.py already configured for port 5002")
                    return True
                
                # Modify port configurations
                content = content.replace('port=5000', 'port=5002')
                content = content.replace('host="0.0.0.0", port=5000', 'host="0.0.0.0", port=5002')
                content = content.replace(':5000', ':5002')
                
                with open(app_path, 'w') as file:
                    file.write(content)
                
                print("🔧 Modified PowerForecast/app.py to use port 5002")
                return True
            return False
        except Exception as e:
            print(f"⚠️ Warning: Could not modify app.py port: {e}")
            return False
    
    def wait_for_api_ready(self, config, timeout=30):
        """Wait for API to be ready by checking health endpoint"""
        url = f"http://localhost:{config['port']}{config['health_endpoint']}"
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    return True
            except requests.RequestException:
                pass
            time.sleep(1)
        
        return False
    
    def start_api(self, api_name, config):
        """Start a single API service with comprehensive error checking"""
        try:
            if not self.check_file_exists(config['file']):
                print(f"❌ File not found: {config['file']}")
                return False
            
            print(f"🚀 Starting {config['name']}...")
            print(f"   File: {config['file']}")
            print(f"   Port: {config['port']}")
            print(f"   Description: {config['description']}")
            
            # Get directory and filename
            api_dir = os.path.dirname(config['file'])
            api_file = os.path.basename(config['file'])
            
            # Create log files for debugging
            log_dir = "logs"
            os.makedirs(log_dir, exist_ok=True)
            stdout_log = open(f"{log_dir}/{api_name}_stdout.log", "w")
            stderr_log = open(f"{log_dir}/{api_name}_stderr.log", "w")
            
            # Start the process
            process = subprocess.Popen([
                sys.executable, api_file
            ], 
            cwd=api_dir if api_dir else '.', 
            stdout=stdout_log, 
            stderr=stderr_log,
            text=True)
            
            self.processes[api_name] = {
                'process': process,
                'stdout_log': stdout_log,
                'stderr_log': stderr_log,
                'config': config
            }
            
            # Wait for the API to be ready
            print(f"⏳ Waiting for {config['name']} to initialize...")
            if self.wait_for_api_ready(config, timeout=45):
                print(f"✅ {config['name']} started successfully")
                return True
            else:
                # API didn't respond, check if process is still alive
                if process.poll() is not None:
                    # Process died, read error logs
                    stdout_log.close()
                    stderr_log.close()
                    
                    with open(f"{log_dir}/{api_name}_stderr.log", "r") as f:
                        error_content = f.read()
                    with open(f"{log_dir}/{api_name}_stdout.log", "r") as f:
                        output_content = f.read()
                    
                    print(f"❌ {config['name']} process died during startup")
                    if error_content.strip():
                        print(f"Error output: {error_content[:500]}...")
                    if output_content.strip():
                        print(f"Output: {output_content[:300]}...")
                else:
                    print(f"❌ {config['name']} started but not responding on port {config['port']}")
                    print(f"Check logs: logs/{api_name}_stdout.log and logs/{api_name}_stderr.log")
                
                # Clean up failed process
                try:
                    process.terminate()
                    process.wait(timeout=5)
                except:
                    process.kill()
                
                return False
                
        except Exception as e:
            print(f"❌ Failed to start {config['name']}: {e}")
            return False
    
    def stop_api(self, api_name):
        """Stop a single API service"""
        if api_name in self.processes:
            process_info = self.processes[api_name]
            process = process_info['process']
            
            try:
                # Close log files
                process_info['stdout_log'].close()
                process_info['stderr_log'].close()
                
                # Terminate process gracefully
                process.terminate()
                process.wait(timeout=5)
                print(f"✅ Stopped {self.api_configs[api_name]['name']}")
            except subprocess.TimeoutExpired:
                # Force kill if graceful shutdown fails
                process.kill()
                process.wait()
                print(f"🔪 Force killed {self.api_configs[api_name]['name']}")
            except Exception as e:
                print(f"⚠️ Error stopping {api_name}: {e}")
            
            del self.processes[api_name]
    
    def stop_all_apis(self):
        """Stop all running API services"""
        for api_name in list(self.processes.keys()):
            self.stop_api(api_name)
    
    def monitor_processes(self):
        """Monitor all processes and restart if needed"""
        while True:
            try:
                for api_name, process_info in list(self.processes.items()):
                    process = process_info['process']
                    if process.poll() is not None:
                        print(f"⚠️ {self.api_configs[api_name]['name']} has stopped")
                        
                        # Read error logs
                        try:
                            with open(f"logs/{api_name}_stderr.log", "r") as f:
                                error_content = f.read()
                            if error_content.strip():
                                print(f"Last error: {error_content[-300:]}")
                        except:
                            pass
                        
                        # Clean up
                        try:
                            process_info['stdout_log'].close()
                            process_info['stderr_log'].close()
                        except:
                            pass
                        
                        del self.processes[api_name]
                
                time.sleep(5)
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"Monitor error: {e}")
                time.sleep(5)
    
    def get_available_apis(self):
        """Get list of available API files"""
        available = {}
        for api_name, config in self.api_configs.items():
            if self.check_file_exists(config['file']):
                available[api_name] = config
        return available
    
    def start_all_apis(self):
        """Start all available APIs"""
        # First, modify app.py port if needed
        self.modify_app_py_port()
        
        print("=" * 70)
        print("🌊 WIND FARM DIGITAL TWIN - MULTI-API LAUNCHER")
        print("=" * 70)
        
        available_apis = self.get_available_apis()
        
        if not available_apis:
            print("❌ No API files found!")
            return False
        
        print(f"📡 Found {len(available_apis)} available APIs:")
        for api_name, config in available_apis.items():
            print(f"   • {config['name']} ({config['file']})")
        
        print("\n🔄 Starting APIs with 5-second intervals...")
        
        # Start each API
        started_apis = []
        for api_name, config in available_apis.items():
            success = self.start_api(api_name, config)
            if success:
                started_apis.append(config)
            
            # Wait before starting next API
            if api_name != list(available_apis.keys())[-1]:  # Don't wait after last API
                print("⏳ Waiting 5 seconds before starting next API...\n")
                time.sleep(5)
        
        # Display summary
        print("\n" + "=" * 70)
        print("📊 API STARTUP SUMMARY")
        print("=" * 70)
        
        if started_apis:
            print(f"✅ Successfully started {len(started_apis)} APIs:")
            for config in started_apis:
                print(f"   • {config['name']}")
                print(f"     URL: http://localhost:{config['port']}")
                print(f"     Health: http://localhost:{config['port']}{config['health_endpoint']}")
            
            print("\n🌐 API ENDPOINTS SUMMARY:")
            print("─" * 40)
            for config in started_apis:
                print(f"Port {config['port']}: {config['description']}")
            
            print("\n📝 TESTING COMMANDS:")
            print("─" * 40)
            for config in started_apis:
                print(f"curl http://localhost:{config['port']}{config['health_endpoint']}")
            
            # Start monitoring
            print(f"\n🔍 Monitoring {len(started_apis)} APIs...")
            print("Press Ctrl+C to shutdown all APIs")
            
            monitor_thread = threading.Thread(target=self.monitor_processes, daemon=True)
            monitor_thread.start()
            
            # Keep main thread alive
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\n🛑 Shutdown requested...")
                self.stop_all_apis()
                return True
        else:
            print("❌ No APIs started successfully")
            print("Check the error messages above and log files in the 'logs' directory")
            return False

def main():
    launcher = WindFarmAPILauncher()
    try:
        launcher.start_all_apis()
    except Exception as e:
        print(f"❌ Launcher error: {e}")
        launcher.stop_all_apis()
    finally:
        print("🏁 Wind Farm API Launcher shutdown complete")

if __name__ == "__main__":
    main()