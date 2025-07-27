#!/usr/bin/env python3
"""
A simple Python file with basic functionality.
"""

def greet(name="World"):
    """Print a greeting message."""
    print(f"Hello, {name}!")

def calculate_sum(a, b):
    """Calculate the sum of two numbers."""
    return a + b

def main():
    """Main function to demonstrate the simple Python file."""
    print("Welcome to the simple Python file!")
    
    # Demonstrate the greet function
    greet()
    greet("Python Developer")
    
    # Demonstrate the calculate_sum function
    result = calculate_sum(5, 3)
    print(f"5 + 3 = {result}")
    
    # Simple list operations
    numbers = [1, 2, 3, 4, 5]
    print(f"Numbers: {numbers}")
    print(f"Sum of numbers: {sum(numbers)}")
    print(f"Average: {sum(numbers) / len(numbers):.2f}")

if __name__ == "__main__":
    main() 