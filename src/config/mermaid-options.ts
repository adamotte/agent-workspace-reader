// Page-wide Mermaid defaults selectable from the popup. Individual diagrams can
// still override them with a frontmatter `config:` block or an init directive.
export const MERMAID_LOOKS = ['classic', 'handDrawn', 'neo'] as const
export type MermaidLook = typeof MERMAID_LOOKS[number]

// Only layouts suited to directed diagrams are offered as a page default; the
// other ELK algorithms and swimlane remain available per diagram.
export const MERMAID_LAYOUTS = ['dagre', 'elk', 'elk.mrtree'] as const
export type MermaidLayout = typeof MERMAID_LAYOUTS[number]
