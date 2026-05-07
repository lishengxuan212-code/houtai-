# Component API Schema

S2.2 introduces `apiSchema` on component definitions. It records official API sections, prop names, Chinese labels, type text, editor type, grouping, paths, visibility rules, and event affordances.

The schema is serializable and does not store functions. Function-like API props such as `onClick` become interaction editor fields under `events.*`.

Primary groups: 基础, 内容, 行为, 数据, 样式, 事件, 高级.
