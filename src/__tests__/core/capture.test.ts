/**
 * Tests for core capture functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { captureFrame, captureManualFrame, compareImages } from '../../core/capture';
import type { CaptureOptions } from '../../types';

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn(() => Promise.resolve('data:image/png;base64,mockdata')),
  toBlob: vi.fn(() => Promise.resolve(new Blob(['mock'], { type: 'image/png' }))),
}));

describe('capture', () => {
  let root: HTMLElement;
  let mockEvent: PointerEvent;
  let options: CaptureOptions;

  beforeEach(() => {
    root = document.createElement('div');
    root.id = 'capture-root';
    root.style.width = '500px';
    root.style.height = '500px';
    document.body.appendChild(root);

    const button = document.createElement('button');
    button.id = 'test-button';
    button.textContent = 'Click me';
    root.appendChild(button);

    mockEvent = new PointerEvent('pointerdown', {
      clientX: 100,
      clientY: 200,
      button: 0,
    });
    Object.defineProperty(mockEvent, 'target', {
      value: button,
      writable: false,
    });

    options = {
      root,
      scale: 2,
      markerStyle: {
        size: 50,
        color: '#ff0000',
      },
    };
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('captureFrame', () => {
    it('should capture a frame with correct metadata', async () => {
      const frame = await captureFrame(root, mockEvent, options, 'reel-123', 0);

      expect(frame).toMatchObject({
        reelId: 'reel-123',
        order: 0,
      });
      expect(frame.id).toBeDefined();
      expect(frame.timestamp).toBeGreaterThan(0);
      expect(frame.image).toContain('data:image');
    });

    it('should include viewport coordinates in metadata', async () => {
      const frame = await captureFrame(root, mockEvent, options, 'reel-123', 0);

      expect(frame.metadata.viewportCoords).toEqual({ x: 100, y: 200 });
    });

    it('should include element path in metadata', async () => {
      const frame = await captureFrame(root, mockEvent, options, 'reel-123', 0);

      expect(frame.metadata.elementPath).toBe('#test-button');
    });

    it('should capture pre-click frame with marker by default', async () => {
      const frame = await captureFrame(root, mockEvent, options, 'reel-123', 0);

      expect(frame.metadata.captureType).toBe('pre-click');
    });

    it('should capture post-click frame without marker', async () => {
      const frame = await captureFrame(root, mockEvent, options, 'reel-123', 1, 'post-click');

      expect(frame.metadata.captureType).toBe('post-click');
    });

    it('should include HTML snapshot if collectHtml is true', async () => {
      const optionsWithHtml = { ...options, collectHtml: true };
      const frame = await captureFrame(root, mockEvent, optionsWithHtml, 'reel-123', 0);

      expect(frame.metadata.htmlSnapshot).toBeDefined();
      expect(frame.metadata.htmlSnapshot).toContain('test-button');
    });

    it('should record button type in metadata', async () => {
      const frame = await captureFrame(root, mockEvent, options, 'reel-123', 0);

      expect(frame.metadata.buttonType).toBe(0);
    });
  });

  describe('captureManualFrame', () => {
    it('should capture a manual frame without pointer event', async () => {
      const frame = await captureManualFrame(root, options, 'reel-123', 0);

      expect(frame).toMatchObject({
        reelId: 'reel-123',
        order: 0,
      });
      expect(frame.metadata.elementPath).toBe('manual-capture');
      expect(frame.metadata.buttonType).toBe(-1);
    });
  });

  describe('compareImages', () => {
    it('should return true for identical images', () => {
      const url1 = 'data:image/png;base64,abc123';
      const url2 = 'data:image/png;base64,abc123';

      expect(compareImages(url1, url2)).toBe(true);
    });

    it('should return false for different images', () => {
      const url1 = 'data:image/png;base64,abc123';
      const url2 = 'data:image/png;base64,def456';

      expect(compareImages(url1, url2)).toBe(false);
    });
  });
});
