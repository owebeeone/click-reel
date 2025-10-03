export function getElementPath(element: HTMLElement, root: HTMLElement): string {
  if (element === root) {
    return 'ROOT';
  }
  if (!root.contains(element)) {
    return 'OUT_OF_BOUNDS';
  }

  // 1. Prioritize data-testid
  if (element.hasAttribute('data-testid')) {
    return `[data-testid="${element.getAttribute('data-testid')}"]`;
  }

  // 2. Prioritize id
  if (element.id) {
    return `#${element.id}`;
  }

  // 3. Fallback to nth-child path
  let path = '';
  let current: Element | null = element;
  while (current && current !== root) {
    const parentEl = current.parentElement as HTMLElement | null;
    if (!parentEl) {
      break;
    }

    const tagName = current.tagName.toLowerCase();
    const siblings: Element[] = Array.from(parentEl.children) as Element[];
    const sameTagSiblings = siblings.filter((sibling: Element) => sibling.tagName.toLowerCase() === tagName);
    
    if (sameTagSiblings.length > 1) {
      const index = sameTagSiblings.indexOf(current) + 1;
      path = `> ${tagName}:nth-of-type(${index}) ${path}`;
    } else {
      path = `> ${tagName} ${path}`;
    }

    current = parentEl;
  }
  return `ROOT ${path}`.trim();
}
