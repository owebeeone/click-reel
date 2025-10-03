/**
 * Tests for DOM utility functions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getElementPath,
  shouldExcludeElement,
  shouldPreserveElement,
  getViewportCoords,
  getRelativeCoords,
  getViewportSize,
  getScrollPosition,
  isWithinRoot,
  cloneAndCleanDOM,
  createMarkerElement,
  injectMarker,
} from '../../utils/dom-utils';

describe('dom-utils', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    root.id = 'test-root';
    document.body.appendChild(root);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('getElementPath', () => {
    it('should return selector with data-testid if present', () => {
      const element = document.createElement('button');
      element.setAttribute('data-testid', 'submit-button');
      root.appendChild(element);

      const path = getElementPath(element, root);
      expect(path).toBe('[data-testid="submit-button"]');
    });

    it('should return id selector if no data-testid', () => {
      const element = document.createElement('button');
      element.id = 'submit-btn';
      root.appendChild(element);

      const path = getElementPath(element, root);
      expect(path).toBe('#submit-btn');
    });

    it('should return CSS path with nth-child for elements without id', () => {
      const parent = document.createElement('div');
      const element1 = document.createElement('button');
      const element2 = document.createElement('button');

      parent.appendChild(element1);
      parent.appendChild(element2);
      root.appendChild(parent);

      const path = getElementPath(element2, root);
      expect(path).toContain('button:nth-child(2)');
    });
  });

  describe('shouldExcludeElement', () => {
    it('should return true for elements with data-screenshot-exclude', () => {
      const element = document.createElement('div');
      element.setAttribute('data-screenshot-exclude', '');

      expect(shouldExcludeElement(element)).toBe(true);
    });

    it('should return false for elements without exclude attribute', () => {
      const element = document.createElement('div');

      expect(shouldExcludeElement(element)).toBe(false);
    });
  });

  describe('shouldPreserveElement', () => {
    it('should return true for elements with data-screenshot-preserve', () => {
      const element = document.createElement('div');
      element.setAttribute('data-screenshot-preserve', '');

      expect(shouldPreserveElement(element)).toBe(true);
    });
  });

  describe('getViewportCoords', () => {
    it('should return clientX and clientY from pointer event', () => {
      const event = new PointerEvent('pointerdown', {
        clientX: 100,
        clientY: 200,
      });

      const coords = getViewportCoords(event);
      expect(coords).toEqual({ x: 100, y: 200 });
    });
  });

  describe('getRelativeCoords', () => {
    it('should return coordinates relative to root element', () => {
      vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({
        left: 50,
        top: 100,
        width: 500,
        height: 500,
        right: 550,
        bottom: 600,
        x: 50,
        y: 100,
        toJSON: () => ({}),
      });

      const event = new PointerEvent('pointerdown', {
        clientX: 150,
        clientY: 250,
      });

      const coords = getRelativeCoords(event, root);
      expect(coords).toEqual({ x: 100, y: 150 });
    });
  });

  describe('getViewportSize', () => {
    it('should return window inner dimensions', () => {
      const size = getViewportSize();
      expect(size).toHaveProperty('width');
      expect(size).toHaveProperty('height');
    });
  });

  describe('getScrollPosition', () => {
    it('should return scroll position', () => {
      const position = getScrollPosition();
      expect(position).toHaveProperty('x');
      expect(position).toHaveProperty('y');
    });
  });

  describe('isWithinRoot', () => {
    it('should return true if element is within root', () => {
      const element = document.createElement('div');
      root.appendChild(element);

      expect(isWithinRoot(element, root)).toBe(true);
    });

    it('should return false if element is not within root', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      expect(isWithinRoot(element, root)).toBe(false);
    });
  });

  describe('cloneAndCleanDOM', () => {
    it('should clone element and remove excluded elements', () => {
      const excluded = document.createElement('div');
      excluded.setAttribute('data-screenshot-exclude', '');
      root.appendChild(excluded);

      const cloned = cloneAndCleanDOM(root);
      expect(cloned.querySelector('[data-screenshot-exclude]')).toBeNull();
    });

    it('should remove elements matching custom selector', () => {
      const element = document.createElement('div');
      element.className = 'exclude-me';
      root.appendChild(element);

      const cloned = cloneAndCleanDOM(root, '.exclude-me');
      expect(cloned.querySelector('.exclude-me')).toBeNull();
    });
  });

  describe('createMarkerElement', () => {
    it('should create marker element at specified coordinates', () => {
      const marker = createMarkerElement({ x: 100, y: 200 }, 0);

      expect(marker.tagName).toBe('DIV');
      expect(marker.hasAttribute('data-click-reel-marker')).toBe(true);
      expect(marker.style.position).toBe('absolute');
    });

    it('should create circular marker for left click (button 0)', () => {
      const marker = createMarkerElement({ x: 100, y: 200 }, 0);
      expect(marker.style.borderRadius).toBe('50%');
    });

    it('should create square marker for middle click (button 1)', () => {
      const marker = createMarkerElement({ x: 100, y: 200 }, 1);
      expect(marker.style.borderRadius).toBe('0');
    });

    it('should create triangle marker for right click (button 2)', () => {
      const marker = createMarkerElement({ x: 100, y: 200 }, 2);
      expect(marker.style.clipPath).toContain('polygon');
    });
  });

  describe('injectMarker', () => {
    it('should inject marker into cloned DOM', () => {
      const cloned = root.cloneNode(true) as HTMLElement;
      const withMarker = injectMarker(cloned, { x: 100, y: 200 }, 0);

      const marker = withMarker.querySelector('[data-click-reel-marker]');
      expect(marker).not.toBeNull();
    });
  });
});
