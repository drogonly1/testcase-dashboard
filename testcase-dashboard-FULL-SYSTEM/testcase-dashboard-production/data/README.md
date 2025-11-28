# Data Directory

Place your Excel test case files here.

Example:
```
data/
  └── testcases.xlsx  <- Your Excel file goes here
```

## Important Notes:

1. **File Format**: Excel .xlsx format
2. **Structure**: Must have data starting from Row 9
3. **Columns**: A-P as specified in documentation
4. **Permissions**: Worker needs read access to this directory

## For Network Drive:
If using network drive, update docker-compose.yml to mount network path:
```yaml
volumes:
  - //server/share/TestCases:/app/data
```

## For Google Sheets:
If using Google Sheets, this directory is not needed.
Just configure spreadsheet ID in .env file.
