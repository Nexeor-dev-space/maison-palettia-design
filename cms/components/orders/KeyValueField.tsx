import type { JSONFieldServerComponent } from "payload";
import React from "react";

/**
 * A read-only JSON field drawn as "name — value" lines instead of Payload's
 * code editor (`{}` with line numbers meant nothing to the front desk).
 * Used for the order's "Policies accepted at checkout" ({ slug: version })
 * and "Seats held per session". `clientProps.empty` is what an empty object
 * says; `clientProps.valuePrefix` goes before each value ("version 3").
 */
export const KeyValueField: JSONFieldServerComponent = (props) => {
  const { clientField, value, data, field } = props;
  const { empty, valuePrefix } = props as unknown as { empty?: string; valuePrefix?: string };
  const name = "name" in field ? field.name : "";
  const raw = value ?? (data as Record<string, unknown> | undefined)?.[name];
  const entries = raw && typeof raw === "object" && !Array.isArray(raw) ? Object.entries(raw as Record<string, unknown>) : [];
  const label = typeof clientField?.label === "string" ? clientField.label : name;
  return (
    <div className="field-type mp-kv">
      <span className="mp-kv__label">{label}</span>
      {entries.length ? (
        <ul className="mp-kv__list">
          {entries.map(([key, val]) => (
            <li key={key}>
              <span>{key.replace(/[-_]+/g, " ")}</span>
              <span>
                {valuePrefix ? `${valuePrefix} ` : ""}
                {typeof val === "object" ? JSON.stringify(val) : String(val)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mp-kv__empty">{empty ?? "Nothing recorded."}</p>
      )}
    </div>
  );
};
