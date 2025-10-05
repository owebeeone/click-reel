/**
 * DOM obfuscation utilities for user privacy
 * Replaces user content with placeholder data while preserving structure
 */

import type { ObfuscationConfig } from "../types/config";

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
    "kbd", // Keyboard shortcuts (e.g., Ctrl+Shift+S)
    "code", // Code snippets
    "h1", // Page/section titles
    "h2", // Section headings
    "h3", // Subsection headings
    "label", // Form labels (UI, not user data)
  ],
  obfuscateSelectors: [
    "[data-screenshot-obfuscate]",
    "input",
    "textarea",
    ".user-content",
    ".sensitive",
  ],
  replacementChar: "X", // Use X instead of block character for better width matching
};

/**
 * Store original values for restoration
 */
export interface ObfuscationBackup {
  timestamp: number; // For tracking backup instances in logs
  textNodes: Array<{ node: Text; originalText: string }>;
  inputs: Array<{
    el: HTMLInputElement | HTMLTextAreaElement;
    originalValue: string;
    originalPlaceholder: string;
  }>;
  // CSS-based obfuscation (layout-neutral)
  styledElements: Array<{
    el: HTMLElement;
    originalFilter: string;
    originalColor: string;
    originalTextShadow: string;
  }>;
}

/**
 * Check PII status by walking up the DOM tree
 * Returns true if element should be obfuscated based on PII classes
 */
function shouldObfuscateByPII(element: HTMLElement): boolean | null {
  let current: HTMLElement | null = element;

  while (current) {
    // Check for explicit PII markers
    if (current.classList.contains("pii-enable")) {
      return true; // Obfuscate
    }
    if (current.classList.contains("pii-disable")) {
      return false; // Don't obfuscate
    }

    // Move up the tree
    current = current.parentElement;
  }

  return null; // No explicit PII marker found
}

/**
 * Check if an element should be preserved (not obfuscated)
 */
function shouldPreserve(
  element: HTMLElement,
  config: ObfuscationConfig
): boolean {
  // Check PII classes first (highest priority)
  const piiStatus = shouldObfuscateByPII(element);
  if (piiStatus === false) {
    return true; // pii-disable means preserve
  }

  // Check if element has preserve attribute
  if (element.hasAttribute("data-screenshot-preserve")) {
    return true;
  }

  // Check if element matches any preserve selector
  for (const selector of config.preserveSelectors) {
    try {
      if (element.matches(selector)) {
        return true;
      }
    } catch (e) {
      // Invalid selector, skip
      continue;
    }
  }

  return false;
}

/**
 * Check if obfuscation should be applied to an element
 */
export function shouldObfuscate(
  element: HTMLElement,
  config: ObfuscationConfig
): boolean {
  // Check PII classes first (highest priority)
  const piiStatus = shouldObfuscateByPII(element);
  if (piiStatus !== null) {
    return piiStatus; // Explicit PII decision (pii-enable=true, pii-disable=false)
  }

  // If explicitly preserved, don't obfuscate
  if (shouldPreserve(element, config)) {
    return false;
  }

  // DEFAULT: Obfuscate everything unless explicitly marked as pii-disable
  // This is the privacy-first approach - opt-out rather than opt-in
  return true;
}

/**
 * Replace text with placeholder characters (preserving length and whitespace structure)
 */
function replaceText(text: string, replacementChar: string): string {
  // Character groups by visual characteristics for better layout preservation
  const descenders = "gjpqy";
  const ascenders = "bdfhklt";
  const wideChars = "mw";
  const narrowChars = "ijl";

  return text.replace(/./g, (char) => {
    if (/\s/.test(char)) return char; // Preserve whitespace exactly

    // Lowercase letters - match by shape characteristics
    if (/[a-z]/.test(char)) {
      if (descenders.includes(char)) return "g"; // descender → g (most average descender)
      if (ascenders.includes(char)) return "h"; // ascender → h (most average ascender)
      if (wideChars.includes(char)) return "m"; // wide → m
      if (narrowChars.includes(char)) return "i"; // narrow → i
      return "o"; // regular → o (most average regular char)
    }

    // Uppercase letters
    if (/[A-Z]/.test(char)) {
      if ("MW".includes(char)) return "M"; // wide uppercase
      if ("IJ".includes(char)) return "I"; // narrow uppercase
      return "O"; // regular uppercase → O
    }

    // Numbers
    if (/[0-9]/.test(char)) return "0";

    // Everything else
    return replacementChar;
  });
}

/**
 * CSS-based text obfuscation (100% layout-neutral)
 * Uses blur filter to make text unreadable without changing layout
 */
function obfuscateTextWithCSS(
  element: HTMLElement,
  config: ObfuscationConfig,
  backup: ObfuscationBackup
): void {
  if (!config.obfuscateText) return;

  // Find all leaf text elements (elements with text but no child elements with text)
  // This is simpler and more effective than TreeWalker
  const allElements = element.querySelectorAll("*");

  allElements.forEach((node) => {
    const el = node as HTMLElement;

    // Skip script, style, svg, and input elements
    if (
      el.tagName === "SCRIPT" ||
      el.tagName === "STYLE" ||
      el.tagName === "SVG" ||
      el.tagName === "INPUT" ||
      el.tagName === "TEXTAREA" ||
      el.tagName === "SELECT"
    ) {
      return;
    }

    // Check if element should be preserved (e.g., pii-disable class)
    if (shouldPreserve(el, config)) {
      return;
    }

    // Check if element should be obfuscated
    if (!shouldObfuscate(el, config)) {
      return;
    }

    // Check if element has any text content (recursively)
    const hasText = el.textContent && el.textContent.trim().length > 0;
    if (!hasText) {
      return;
    }

    // Only obfuscate leaf elements (elements that don't have child elements with text)
    // This prevents applying blur multiple times in nested structures
    const hasTextChildren = Array.from(el.children).some((child) => {
      const childText = child.textContent?.trim() || "";
      return childText.length > 0;
    });

    if (!hasTextChildren) {
      // This is a leaf element with text - apply blur
      backup.styledElements.push({
        el,
        originalFilter: el.style.filter,
        originalColor: el.style.color,
        originalTextShadow: el.style.textShadow,
      });

      // Apply blur filter to make text unreadable
      el.style.filter = "blur(5px)";
      el.style.userSelect = "none"; // Prevent text selection
    }
  });

  console.log(
    `🔒 Applied blur to ${backup.styledElements.length} text elements`
  );
}

/**
 * CSS-based input obfuscation (100% layout-neutral)
 */
function obfuscateInputsWithCSS(
  element: HTMLElement,
  config: ObfuscationConfig,
  backup: ObfuscationBackup
): void {
  if (!config.obfuscateInputs) return;

  const inputs = element.querySelectorAll("input, textarea") as NodeListOf<
    HTMLInputElement | HTMLTextAreaElement
  >;

  inputs.forEach((input) => {
    // Check if input should be preserved
    if (shouldPreserve(input, config)) {
      return;
    }

    // Check if should be obfuscated
    if (!shouldObfuscate(input, config)) {
      return;
    }

    // Store original styles
    backup.styledElements.push({
      el: input as HTMLElement,
      originalFilter: input.style.filter,
      originalColor: input.style.color,
      originalTextShadow: input.style.textShadow,
    });

    // Apply blur filter to make input value unreadable
    input.style.filter = "blur(5px)";
    input.style.userSelect = "none";
  });
}

/**
 * Legacy text obfuscation (character replacement - NOT layout-neutral)
 * Kept for reference but not used by default
 */
function obfuscateTextContent(
  element: HTMLElement,
  config: ObfuscationConfig
): void {
  if (!config.obfuscateText) return;

  // Walk through all text nodes
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      // Skip script and style tags
      if (
        node.parentElement?.tagName === "SCRIPT" ||
        node.parentElement?.tagName === "STYLE"
      ) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  textNodes.forEach((textNode) => {
    const parent = textNode.parentElement;
    if (!parent) return;

    // Check if parent should be preserved
    if (shouldPreserve(parent, config)) {
      return;
    }

    const text = textNode.textContent;
    if (text && text.trim().length > 0) {
      textNode.textContent = replaceText(text, config.replacementChar);
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
 * Obfuscate data-* attributes
 */
function obfuscateDataAttributes(
  element: HTMLElement,
  config: ObfuscationConfig
): void {
  const elements = element.querySelectorAll("*");
  elements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (shouldPreserve(htmlEl, config)) return;

    // Obfuscate data-* attributes
    Array.from(htmlEl.attributes).forEach((attr) => {
      if (
        attr.name.startsWith("data-") &&
        attr.name !== "data-screenshot-preserve" &&
        attr.name !== "data-screenshot-obfuscate"
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
 * Non-destructive obfuscation - temporarily replaces text in-place
 * Returns backup data for restoration
 */
export function obfuscateInPlace(
  element: HTMLElement,
  config: ObfuscationConfig = DEFAULT_OBFUSCATION_CONFIG
): ObfuscationBackup {
  const backup: ObfuscationBackup = {
    timestamp: Date.now(),
    textNodes: [],
    inputs: [],
    styledElements: [],
  };

  // Use CSS-based obfuscation for text (100% layout-neutral)
  if (config.obfuscateText) {
    obfuscateTextWithCSS(element, config, backup);
  }

  // Use CSS-based obfuscation for inputs
  if (config.obfuscateInputs) {
    obfuscateInputsWithCSS(element, config, backup);
  }

  console.log(
    `🔒 CSS-obfuscated ${backup.styledElements.length} elements (layout-neutral)`
  );

  return backup;
}

/**
 * Legacy character-replacement obfuscation (NOT layout-neutral, kept for reference)
 */
export function obfuscateInPlaceLegacy(
  element: HTMLElement,
  config: ObfuscationConfig = DEFAULT_OBFUSCATION_CONFIG
): ObfuscationBackup {
  const backup: ObfuscationBackup = {
    timestamp: Date.now(),
    textNodes: [],
    inputs: [],
    styledElements: [],
  };

  // Obfuscate text nodes (legacy character replacement)
  if (config.obfuscateText) {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        // Skip script, style, and empty text nodes
        const parent = node.parentElement;
        if (
          !parent ||
          parent.tagName === "SCRIPT" ||
          parent.tagName === "STYLE"
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        if (!node.textContent || node.textContent.trim() === "") {
          return NodeFilter.FILTER_REJECT;
        }
        // Check if parent should be preserved
        if (shouldPreserve(parent, config)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let textNode: Text | null;
    while ((textNode = walker.nextNode() as Text)) {
      const originalText = textNode.textContent || "";
      if (originalText.trim()) {
        backup.textNodes.push({ node: textNode, originalText });
        textNode.textContent = replaceText(
          originalText,
          config.replacementChar
        );
      }
    }
  }

  // Obfuscate input values
  if (config.obfuscateInputs) {
    const inputs = element.querySelectorAll("input, textarea") as NodeListOf<
      HTMLInputElement | HTMLTextAreaElement
    >;
    inputs.forEach((input) => {
      if (shouldPreserve(input, config)) return;

      const originalValue = input.value;
      const originalPlaceholder = input.placeholder;

      if (originalValue) {
        backup.inputs.push({ el: input, originalValue, originalPlaceholder });
        input.value = config.replacementChar.repeat(originalValue.length);
        if (input.placeholder) {
          input.placeholder = config.replacementChar.repeat(
            input.placeholder.length
          );
        }
      }
    });
  }

  console.log(
    `🔒 Obfuscated ${backup.textNodes.length} text nodes and ${backup.inputs.length} inputs in-place`,
    "Backup ID:",
    backup.timestamp
  );
  return backup;
}

/**
 * Restore original styles and content from backup
 */
export function restoreObfuscation(backup: ObfuscationBackup): void {
  console.log(
    `🔓 [START RESTORE] Restoring ${backup.styledElements.length} CSS elements, ${backup.textNodes.length} text nodes, and ${backup.inputs.length} inputs`,
    "Backup ID:",
    backup.timestamp
  );

  // Restore CSS-styled elements (primary method)
  backup.styledElements.forEach(
    ({ el, originalFilter, originalColor, originalTextShadow }) => {
      if (el.parentNode) {
        // Restore original CSS properties
        if (originalFilter) {
          el.style.filter = originalFilter;
        } else {
          el.style.removeProperty("filter");
        }

        if (originalColor) {
          el.style.color = originalColor;
        } else {
          el.style.removeProperty("color");
        }

        if (originalTextShadow) {
          el.style.textShadow = originalTextShadow;
        } else {
          el.style.removeProperty("text-shadow");
        }

        // Also remove user-select
        el.style.removeProperty("user-select");
      }
    }
  );

  // Restore text nodes (legacy)
  backup.textNodes.forEach(({ node, originalText }) => {
    if (node.parentNode) {
      node.textContent = originalText;
    }
  });

  // Restore inputs (legacy)
  backup.inputs.forEach(({ el, originalValue, originalPlaceholder }) => {
    if (el.parentNode) {
      el.value = originalValue;
      el.placeholder = originalPlaceholder;
    }
  });

  console.log(
    `🔓 [END RESTORE] Restored ${backup.styledElements.length} CSS elements, ${backup.textNodes.length} text nodes, and ${backup.inputs.length} inputs`,
    "Backup ID:",
    backup.timestamp
  );
}

/**
 * Main obfuscation function - clones element and obfuscates content
 */
export function obfuscateDOM(
  originalElement: HTMLElement,
  config: ObfuscationConfig
): HTMLElement {
  const cloned = originalElement.cloneNode(true) as HTMLElement;

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
