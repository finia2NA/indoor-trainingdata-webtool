#!/usr/bin/env python3
import csv
import json
import sys
import os

def convert_csv_to_json(input_file, output_file=None):
    """
    Convert CSV/TXT file with image coordinates to JSON format.
    
    Expected CSV format:
    File,Time,Long,Lat,Alt,Course,Pitch,Roll
    "pic_1724758467.960621.jpg",1724758467.6506,0.0767,0.0292,0.52373,17.5384,0,0
    
    Output JSON format:
    [
      {
        "name": "pic_1724758467.960621.jpg",
        "x": 0.0767,
        "y": 0.0292,
        "z": 0.52373,
        "course": 17.5384
      }
    ]
    """
    
    if not os.path.exists(input_file):
        print(f"Error: Input file '{input_file}' not found.")
        return False
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            # Read the CSV file (tab-delimited)
            csv_reader = csv.reader(f, delimiter='\t')
            
            # Skip header row
            next(csv_reader)
            
            result = []
            
            for row in csv_reader:
                if len(row) >= 6:  # Ensure we have enough columns
                    # Extract filename (remove quotes if present)
                    filename = row[0].strip('"')
                    
                    # Extract coordinates and course
                    try:
                        x = float(row[2])  # Long
                        y = float(row[4])  # Alt (using altitude as y)
                        z = float(row[3])  # Lat (using latitude as z)
                        course = float(row[5])  # Course
                        
                        entry = {
                            "name": filename,
                            "x": x,
                            "y": y,
                            "z": z,
                            "course": course
                        }
                        
                        result.append(entry)
                        
                    except ValueError as e:
                        print(f"Warning: Skipping row due to invalid number format: {row}")
                        continue
        
        # Determine output file
        if output_file is None:
            base_name = os.path.splitext(input_file)[0]
            output_file = f"{base_name}.json"
        
        # Write JSON output
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2)
        
        print(f"Successfully converted {len(result)} entries from '{input_file}' to '{output_file}'")
        return True
        
    except Exception as e:
        print(f"Error processing file: {e}")
        return False

def main():
    if len(sys.argv) < 2:
        print("Usage: python convert.py <input_file> [output_file]")
        print("Example: python convert.py data.csv")
        print("Example: python convert.py data.txt output.json")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    success = convert_csv_to_json(input_file, output_file)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()