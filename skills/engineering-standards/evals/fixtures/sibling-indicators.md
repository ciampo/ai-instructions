# Component indicators

The menu trigger and calendar trigger each draw a two-pixel accent outline on
keyboard focus. The design specifies one focus treatment for all triggers.
The components package already provides a focus-ring mixin that each trigger
can apply to its own focusable element.

The table draws an identical outline on a selected row, including when focus
is elsewhere. Row selection is themed separately from trigger focus. One
proposed cleanup puts all three selectors in the menu stylesheet and reaches
into the calendar and table components by their internal class names.
