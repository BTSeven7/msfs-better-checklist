import pandas as pd
import json
import os
from tkinter import filedialog
from tkinter import Tk

def convert_excel_to_checklist():
    # Create Tk root window and hide it
    root = Tk()
    root.withdraw()

    # Open file dialog for Excel file selection
    excel_file = filedialog.askopenfilename(
        title="Select Excel Checklist File",
        filetypes=[("Excel files", "*.xlsx")]
    )

    if not excel_file:
        return

    # Read the Excel sheets
    header_df = pd.read_excel(excel_file, sheet_name='Header')
    sections_df = pd.read_excel(excel_file, sheet_name='Sections')
    items_df = pd.read_excel(excel_file, sheet_name='Items')

    # Process Header
    aircraft = header_df.iloc[0]['aircraft']
    author = header_df.iloc[0]['author']

    # Create checklist structure
    checklist = {
        "Header": {
            "aircraft": aircraft,
            "author": author
        },
        "Sections": []
    }

    # Process Sections and Items
    for idx, section in sections_df.iterrows():
        section_id = f"section-{str(idx + 1).zfill(2)}"
        section_items = items_df[items_df['section_id'] == idx + 1].copy()

        section_dict = {
            "id": section_id,
            "title": section['title'],
            "subtext": section['subtext'] if pd.notna(section['subtext']) else None,
            "checkItems": []
        }

        # Process items for each section
        for _, item in section_items.iterrows():
            if pd.notna(item['item']) or pd.notna(item['expect']):  # Skip blank rows
                item_dict = {
                    "item": item['item'] if pd.notna(item['item']) else "",
                    "expect": item['expect'] if pd.notna(item['expect']) else "",
                    "apiData": None,
                    "apiVar": item['apiVar'] if pd.notna(item['apiVar']) else None,
                    "wxUpdates": True if pd.notna(item['wxUpdates']) and item['wxUpdates'] else False
                }
                section_dict["checkItems"].append(item_dict)

        checklist["Sections"].append(section_dict)

    # Create filename and save
    filename = f"{aircraft.replace(' ', '_')}_{author}_checkguide.json"
    filepath = filename

    with open(filepath, 'w') as f:
        json.dump(checklist, f, indent=2)

    print(f"Checklist created successfully: {filename}")

if __name__ == "__main__":
    convert_excel_to_checklist()
