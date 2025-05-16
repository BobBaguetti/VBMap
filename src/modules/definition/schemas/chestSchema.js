// @file: src/modules/definition/schemas/chestSchema.js
// @version: 1.0 — schema for Chest definitions

export const chestSchema = {
  showInFilters:  { type: "checkbox", label: "Show in filters",  default: true },
  name:           { type: "text",     label: "Name",            colorable: "nameColor" },
  category:       { type: "select",   label: "Category",        options: [
                    "Normal","Dragonvault"
                  ]},
  size:           { type: "select",   label: "Size",            options: [
                    "Small","Medium","Large"
                  ]},
  description:    { type: "textarea", label: "Description",     colorable: "descriptionColor" },
  imageSmall:     { type: "imageUrl", label: "Icon URL" },
  extraLines:     { type: "extraInfo",label: "Extra Info" }
};
