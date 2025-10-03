/**
 * DOM utility functions for element path generation and manipulation
 */

import { EXCLUDE_ATTRIBUTE, PRESERVE_ATTRIBUTE } from './constants';

/**
 * Generates a robust selector path to an element
 * Priority: data-testid → id → CSS path with nth-child
 */
export function getElementPath(
  element: HTMLElement | null,
  root: HTMLElement
): string {
  // Handle null element (e.g., from synthetic events)
  if (!element) {
    return root.tagName.toLowerCase();
  }

  // Check for data-testid attribute (highest priority)
  const testId = element.getAttribute("data-testid");
  if (testId) {
    return `[data-testid="${testId}"]`;
  }

  // Check for id attribute
  if (element.id) {
    return `#${element.id}`;
  }

  // Build CSS path with nth-child indices
  const path: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== root && current !== document.body) {
    const parent: HTMLElement | null = current.parentElement;
    if (!parent) break;

    const tagName = current.tagName.toLowerCase();
    const siblings = Array.from(parent.children).filter(
      (el: Element) => el.tagName.toLowerCase() === tagName
    );

    if (siblings.length > 1) {
      const index = siblings.indexOf(current) + 1;
      path.unshift(`${tagName}:nth-child(${index})`);
    } else {
      path.unshift(tagName);
    }

    current = parent;
  }

  return path.join(" > ") || "unknown";
}

/**
 * Checks if an element should be excluded from capture
 */
export function shouldExcludeElement(element: HTMLElement): boolean {
  return element.hasAttribute(EXCLUDE_ATTRIBUTE);
}

/**
 * Checks if an element should be preserved during obfuscation
 */
export function shouldPreserveElement(element: HTMLElement): boolean {
  return element.hasAttribute(PRESERVE_ATTRIBUTE);
}

/**
 * Gets viewport coordinates from a pointer event
 */
export function getViewportCoords(event: PointerEvent): {
  x: number;
  y: number;
} {
  return {
    x: event.clientX,
    y: event.clientY,
  };
}

/**
 * Gets coordinates relative to a root element
 */
export function getRelativeCoords(
  event: PointerEvent,
  root: HTMLElement
): { x: number; y: number } {
  const rootRect = root.getBoundingClientRect();
  return {
    x: event.clientX - rootRect.left,
    y: event.clientY - rootRect.top,
  };
}

/**
 * Gets current viewport size
 */
export function getViewportSize(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Gets current scroll position
 */
export function getScrollPosition(): { x: number; y: number } {
  return {
    x: window.scrollX || window.pageXOffset,
    y: window.scrollY || window.pageYOffset,
  };
}

/**
 * Checks if an element is within the bounds of a root element
 */
export function isWithinRoot(element: HTMLElement, root: HTMLElement): boolean {
  return root.contains(element);
}

/**
 * Clones a node and removes excluded elements
 */
export function cloneAndCleanDOM(element: HTMLElement, excludeSelector?: string): HTMLElement {
  const cloned = element.cloneNode(true) as HTMLElement;

  // Remove elements with exclude attribute
  const excludedByAttr = cloned.querySelectorAll(`[${EXCLUDE_ATTRIBUTE}]`);
  excludedByAttr.forEach((el) => el.remove());

  // Remove elements matching custom exclude selector
  if (excludeSelector) {
    const excludedBySelector = cloned.querySelectorAll(excludeSelector);
    excludedBySelector.forEach((el) => el.remove());
  }

  return cloned;
}

/**
 * Creates a marker element at specified coordinates
 */
export function createMarkerElement(
  coords: { x: number; y: number },
  buttonType: number,
  style: {
    size?: number;
    color?: string;
    opacity?: number;
    borderWidth?: number;
    borderColor?: string;
  } = {}
): HTMLElement {
  const marker = document.createElement('div');
  marker.setAttribute('data-click-reel-marker', 'true');
  marker.setAttribute(EXCLUDE_ATTRIBUTE, 'true');

  const size = style.size || 50;
  const color = style.color || '#ff0000';
  const opacity = style.opacity ?? 0.5;
  const borderWidth = style.borderWidth || 2;
  const borderColor = style.borderColor || '#ffffff';

  // Different styles for different button types
  let shape = 'circle';
  if (buttonType === 1) {
    // Middle click - square
    shape = 'square';
  } else if (buttonType === 2) {
    // Right click - triangle
    shape = 'triangle';
  }

  marker.style.cssText = `
    position: absolute;
    left: ${coords.x - size / 2}px;
    top: ${coords.y - size / 2}px;
    width: ${size}px;
    height: ${size}px;
    background-color: ${color};
    opacity: ${opacity};
    border: ${borderWidth}px solid ${borderColor};
    border-radius: ${shape === 'circle' ? '50%' : shape === 'square' ? '0' : '0'};
    pointer-events: none;
    z-index: 999999;
    ${
      shape === 'triangle'
        ? `
      clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
      border-radius: 0;
    `
        : ''
    }
  `;

  return marker;
}

/**
 * Injects a marker into a cloned DOM at specified coordinates
 */
export function injectMarker(
  clonedDOM: HTMLElement,
  coords: { x: number; y: number },
  buttonType: number,
  markerStyle: {
    size?: number;
    color?: string;
    opacity?: number;
    borderWidth?: number;
    borderColor?: string;
  } = {}
): HTMLElement {
  const marker = createMarkerElement(coords, buttonType, markerStyle);
  clonedDOM.appendChild(marker);
  return clonedDOM;
}
