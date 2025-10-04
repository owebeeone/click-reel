/**
 * Empty state component - shown when no reels exist
 */

import { Film, MousePointer, Download, Play } from "lucide-react";

export interface EmptyStateProps {
  /** Callback when "Start Recording" is clicked */
  onStartRecording?: () => void;
}

/**
 * Empty state with onboarding instructions
 */
export function EmptyState({ onStartRecording }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 2rem",
        textAlign: "center",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "2rem",
        }}
      >
        <Film size={40} color="white" />
      </div>

      {/* Title */}
      <h2
        style={{
          margin: "0 0 1rem 0",
          fontSize: "28px",
          fontWeight: 700,
          color: "#1e293b",
        }}
      >
        Welcome to Click Reel!
      </h2>

      {/* Description */}
      <p
        style={{
          margin: "0 0 2rem 0",
          fontSize: "16px",
          color: "#64748b",
          maxWidth: "480px",
          lineHeight: 1.6,
        }}
      >
        Create beautiful click-through demonstrations by recording your
        interactions. Every click is captured automatically and can be exported
        as an animated GIF or APNG.
      </p>

      {/* How it works */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "2rem",
          maxWidth: "800px",
          width: "100%",
          marginBottom: "2rem",
        }}
      >
        <StepCard
          icon={<MousePointer size={24} />}
          step="1"
          title="Arm & Click"
          description="Enable recording and interact with your page naturally"
        />
        <StepCard
          icon={<Film size={24} />}
          step="2"
          title="Auto Capture"
          description="Each click automatically captures before and after states"
        />
        <StepCard
          icon={<Download size={24} />}
          step="3"
          title="Export"
          description="Download as GIF, APNG, or individual frames as ZIP"
        />
      </div>

      {/* CTA Button */}
      {onStartRecording && (
        <button
          onClick={onStartRecording}
          style={{
            padding: "14px 28px",
            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 6px 16px rgba(59, 130, 246, 0.4)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 4px 12px rgba(59, 130, 246, 0.3)";
          }}
        >
          <Play size={20} />
          Start Your First Recording
        </button>
      )}

      {/* Keyboard Shortcuts */}
      <div
        style={{
          marginTop: "3rem",
          padding: "1.5rem",
          background: "#f8fafc",
          borderRadius: "8px",
          maxWidth: "600px",
          width: "100%",
          border: "1px solid #e2e8f0",
        }}
      >
        <h3
          style={{
            margin: "0 0 1rem 0",
            fontSize: "14px",
            fontWeight: 600,
            color: "#1e293b",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          ⌨️ Keyboard Shortcuts
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "0.75rem",
            fontSize: "14px",
          }}
        >
          <kbd style={kbdStyle}>Ctrl+Shift+R</kbd>
          <span style={{ color: "#64748b" }}>Toggle recorder visibility</span>

          <kbd style={kbdStyle}>Ctrl+Shift+S</kbd>
          <span style={{ color: "#64748b" }}>Start/stop recording</span>

          <kbd style={kbdStyle}>Ctrl+Shift+A</kbd>
          <span style={{ color: "#64748b" }}>
            Arm capture (click to capture)
          </span>

          <kbd style={kbdStyle}>Ctrl+Shift+F</kbd>
          <span style={{ color: "#64748b" }}>Add frame manually</span>

          <kbd style={kbdStyle}>Ctrl+Shift+O</kbd>
          <span style={{ color: "#64748b" }}>Toggle obfuscation</span>

          <kbd style={kbdStyle}>Ctrl+Shift+G</kbd>
          <span style={{ color: "#64748b" }}>Open settings</span>

          <kbd style={kbdStyle}>Ctrl+Shift+E</kbd>
          <span style={{ color: "#64748b" }}>Open inventory</span>
        </div>
      </div>

      {/* Tips */}
      <div
        style={{
          marginTop: "2rem",
          padding: "1.5rem",
          background: "#f8fafc",
          borderRadius: "8px",
          maxWidth: "600px",
          width: "100%",
        }}
      >
        <h3
          style={{
            margin: "0 0 1rem 0",
            fontSize: "16px",
            fontWeight: 600,
            color: "#475569",
          }}
        >
          💡 Pro Tips
        </h3>
        <ul
          style={{
            margin: 0,
            paddingLeft: "1.5rem",
            textAlign: "left",
            fontSize: "14px",
            color: "#64748b",
            lineHeight: 1.8,
          }}
        >
          <li>
            Position the recorder in a corner that won't interfere with your
            demo
          </li>
          <li>Click "Add Frame" to manually capture the current state</li>
          <li>Review frames before exporting to ensure quality</li>
          <li>Export to APNG for better quality than GIF</li>
          <li>Enable obfuscation to hide sensitive personal information</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Step card component for the "how it works" section
 */
function StepCard({
  icon,
  step,
  title,
  description,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "1.5rem",
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
      }}
    >
      {/* Step number badge */}
      <div
        style={{
          position: "relative",
          width: "56px",
          height: "56px",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#f1f5f9",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#3b82f6",
          }}
        >
          {icon}
        </div>
        <div
          style={{
            position: "absolute",
            top: "-8px",
            right: "-8px",
            width: "24px",
            height: "24px",
            background: "#3b82f6",
            color: "white",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 700,
            border: "3px solid white",
          }}
        >
          {step}
        </div>
      </div>

      <h4
        style={{
          margin: "0 0 0.5rem 0",
          fontSize: "16px",
          fontWeight: 600,
          color: "#1e293b",
        }}
      >
        {title}
      </h4>
      <p
        style={{
          margin: 0,
          fontSize: "14px",
          color: "#64748b",
          lineHeight: 1.5,
        }}
      >
        {description}
      </p>
    </div>
  );
}

const kbdStyle: React.CSSProperties = {
  padding: "2px 6px",
  background: "white",
  border: "1px solid #cbd5e1",
  borderRadius: "4px",
  fontSize: "12px",
  fontFamily: "monospace",
  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
};
