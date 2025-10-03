/**
 * DOM obfuscation utilities for user privacy
 * Replaces user content with placeholder data while preserving structure
 */

import { ObfuscationConfig } from "../types/config";

/**
 * Default obfuscation configuration
 */
export const DEFAULT_OBFUSCATION_CONFIG: ObfuscationConfig = {
  obfuscateText: true,
  obfuscateImages: true,
  obfuscateInputs: true,
  preserveSelectors: [
    "[data-screenshot-preserve]",
    ".logo",
    ".brand",
    "nav a", // Navigation text usually safe
    "button", // Button text usually safe
  ],
  obfuscateSelectors: [
    "[data-screenshot-obfuscate]",
    "input",
    "textarea",
    ".user-content",
    ".sensitive",
  ],
  replacementChar: "█",
};

/**
 * Check if an element should be preserved (not obfuscated)
 */
function shouldPreserve(
  element: HTMLElement,
  config: ObfuscationConfig
): boolean {
  // Check if element has preserve attribute
  if (element.hasAttribute("data-screenshot-preserve")) {
    return true;
  }

  // Check if element matches any preserve selectors
  return config.preserveSelectors.some((selector) => {
    try {
      return element.matches(selector);
    } catch {
      return false;
    }
  });
}

/**
 * Check if an element should be obfuscated
 */
export function shouldObfuscate(
  element: HTMLElement,
  config: ObfuscationConfig
): boolean {
  // Always preserve excluded elements
  if (element.hasAttribute("data-screenshot-exclude")) {
    return false;
  }

  // Check if explicitly marked for preservation
  if (shouldPreserve(element, config)) {
    return false;
  }

  // Check if element has obfuscate attribute
  if (element.hasAttribute("data-screenshot-obfuscate")) {
    return true;
  }

  // Check if element matches any obfuscate selectors
  return config.obfuscateSelectors.some((selector) => {
    try {
      return element.matches(selector);
    } catch {
      return false;
    }
  });
}

/**
 * Replace text with placeholder characters while preserving length and structure
 */
function replaceText(text: string, replacementChar: string = "█"): string {
  if (!text || text.trim().length === 0) {
    return text;
  }

  return text.replace(/\S/g, (char) => {
    // Preserve whitespace, newlines, and punctuation structure
    if (/\s/.test(char)) return char;
    if (/[.,!?;:(){}[\]"'`]/.test(char)) return char;
    // Replace alphanumeric and other visible characters
    return replacementChar;
  });
}

/**
 * Obfuscate text content in an element
 */
function obfuscateTextContent(
  element: HTMLElement,
  config: ObfuscationConfig
): void {
  // Skip if text obfuscation is disabled
  if (!config.obfuscateText) return;

  // Skip if this element should be preserved
  if (shouldPreserve(element, config)) return;

  // Process text nodes
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;

      // Skip script, style, and preserved elements
      if (
        parent.tagName === "SCRIPT" ||
        parent.tagName === "STYLE" ||
        shouldPreserve(parent, config)
      ) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Node[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    textNodes.push(node);
  }

  // Replace text in all collected nodes
  textNodes.forEach((textNode) => {
    if (textNode.textContent) {
      textNode.textContent = replaceText(
        textNode.textContent,
        config.replacementChar
      );
    }
  });
}

/**
 * Obfuscate images by replacing with solid color blocks
 */
function obfuscateImages(
  element: HTMLElement,
  config: ObfuscationConfig
): void {
  if (!config.obfuscateImages) return;

  const images = element.querySelectorAll("img");
  images.forEach((img) => {
    const htmlImg = img as HTMLImageElement;

    // Skip preserved images
    if (shouldPreserve(htmlImg, config)) return;

    // Replace image with a solid color block
    const width = htmlImg.width || htmlImg.offsetWidth || 100;
    const height = htmlImg.height || htmlImg.offsetHeight || 100;

    // Create a data URL with a solid gray color
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#cbd5e1"; // Light gray
      ctx.fillRect(0, 0, width, height);
      htmlImg.src = canvas.toDataURL();
    }

    // Also remove alt text
    htmlImg.alt = replaceText(htmlImg.alt, config.replacementChar);
  });

  // Obfuscate background images
  const elementsWithBg = element.querySelectorAll("*");
  elementsWithBg.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (shouldPreserve(htmlEl, config)) return;

    const bgImage = window.getComputedStyle(htmlEl).backgroundImage;
    if (bgImage && bgImage !== "none") {
      htmlEl.style.backgroundImage = "none";
      htmlEl.style.backgroundColor = "#cbd5e1";
    }
  });
}

/**
 * Obfuscate form inputs by replacing their values with placeholder characters
 */
function obfuscateInputs(
  element: HTMLElement,
  config: ObfuscationConfig
): void {
  if (!config.obfuscateInputs) return;

  // Obfuscate input fields
  const inputs = element.querySelectorAll(
    "input, textarea, select"
  ) as NodeListOf<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

  console.log(`🔒 Obfuscating ${inputs.length} input elements`);

  inputs.forEach((input, index) => {
    if (shouldPreserve(input, config)) {
      console.log(`  Input ${index}: Preserved (data-screenshot-preserve)`);
      return;
    }

    if (
      input instanceof HTMLInputElement ||
      input instanceof HTMLTextAreaElement
    ) {
      const originalValue = input.value;
      if (originalValue) {
        // For input fields, replace each character with the replacement char
        // This makes it more obvious that obfuscation is active
        const obfuscatedValue = config.replacementChar.repeat(
          originalValue.length
        );
        console.log(
          `  Input ${index}: "${originalValue}" -> "${obfuscatedValue}"`
        );
        input.value = obfuscatedValue;
        // Also set the attribute for rendering
        input.setAttribute("value", obfuscatedValue);
      }

      // Also obfuscate placeholder
      if (input.placeholder) {
        const obfuscatedPlaceholder = config.replacementChar.repeat(
          input.placeholder.length
        );
        input.placeholder = obfuscatedPlaceholder;
      }
    }
  });
}

/**
 * Obfuscate data attributes (except screenshot-related ones)
 */
function obfuscateDataAttributes(
  element: HTMLElement,
  config: ObfuscationConfig
): void {
  const allElements = element.querySelectorAll("*");
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (shouldPreserve(htmlEl, config)) return;

    // Get all data attributes
    const dataAttrs = Array.from(htmlEl.attributes).filter((attr) =>
      attr.name.startsWith("data-")
    );

    dataAttrs.forEach((attr) => {
      // Skip screenshot-related attributes
      if (
        attr.name.startsWith("data-screenshot-") ||
        attr.name === "data-testid"
      ) {
        return;
      }

      // Obfuscate the value
      if (attr.value) {
        htmlEl.setAttribute(
          attr.name,
          replaceText(attr.value, config.replacementChar)
        );
      }
    });
  });
}

/**
 * Obfuscate a DOM element and its children
 * Returns a cloned, obfuscated copy of the element
 */
export function obfuscateDOM(
  element: HTMLElement,
  config: ObfuscationConfig = DEFAULT_OBFUSCATION_CONFIG
): HTMLElement {
  // Clone the element to avoid modifying the original
  const cloned = element.cloneNode(true) as HTMLElement;

  // Apply obfuscation
  obfuscateTextContent(cloned, config);
  obfuscateImages(cloned, config);
  obfuscateInputs(cloned, config);
  obfuscateDataAttributes(cloned, config);

  return cloned;
}

/**
 * Check if obfuscation is enabled for an element
 */
export function isObfuscationEnabled(element: HTMLElement): boolean {
  return (
    element.hasAttribute("data-obfuscation-enabled") ||
    element.getAttribute("data-obfuscation-enabled") === "true"
  );
}

/**
 * Set obfuscation state on an element
 */
export function setObfuscationState(
  element: HTMLElement,
  enabled: boolean
): void {
  if (enabled) {
    element.setAttribute("data-obfuscation-enabled", "true");
  } else {
    element.removeAttribute("data-obfuscation-enabled");
  }
}
