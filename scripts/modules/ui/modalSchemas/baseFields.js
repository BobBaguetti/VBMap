// @file: scripts/modules/ui/modalSchemas/baseFields.js
// @version: 2
/**
 * Core fields shared by all definition modals.
 */
export const baseFields = [
    {
      name: "id",
      label: "ID",
      type: "hidden",
    },
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
    },
    {
      name: "desc",
      label: "Desc",
      type: "textarea",
      extraInfo: true,             // use universalForm extra-info UI
    },
  ];
  