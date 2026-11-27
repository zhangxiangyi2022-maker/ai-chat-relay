import type { ChatMessage, ExtractedMessageNode, TimelineNode } from '../types/index.js';

export function buildTimelineNodes(
  nodes: ExtractedMessageNode[],
  mutedIndices: Set<number>
): TimelineNode[] {
  return nodes.map((node) => {
    const text = node.content;
    const singleLine = text.replace(/```[\s\S]*?```/g, '[code]').replace(/\s+/g, ' ').trim();
    return {
      index: node.index,
      role: node.role,
      preview: singleLine.slice(0, 72) + (singleLine.length > 72 ? '...' : ''),
      hasCode: /```/.test(text),
      hasMath: /\$[^$]+\$|\$\$[\s\S]+?\$\$/.test(text),
      hasTable: /^\|.+\|\s*\n\|[\s:-]+\|/m.test(text),
      muted: mutedIndices.has(node.index),
      element: node.element,
    };
  });
}

export function selectMessagesForHandoff(
  nodes: ExtractedMessageNode[],
  options: { upToIndex?: number; mutedIndices: Set<number> }
): ChatMessage[] {
  const maxIdx = options.upToIndex ?? nodes.length - 1;
  return nodes
    .filter((n) => n.index <= maxIdx && !options.mutedIndices.has(n.index))
    .map(({ role, content, thinking }) => (thinking ? { role, content, thinking } : { role, content }));
}
