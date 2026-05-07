# Ant Design API Coverage

S2.2 adds an API coverage report with these states:

- `full`: all tracked API props have visual editor mappings.
- `partial`: useful visual editors exist, but known official API props remain missing.
- `missing`: no API schema has been added yet.

Current acceptance slice:

- FloatButton: full
- FloatButton.Group: full
- FloatButton.BackTop: full
- Table: partial
- ProTable: partial

Coverage is intentionally explicit so the component library cannot hide missing official parameters behind a working preview.
