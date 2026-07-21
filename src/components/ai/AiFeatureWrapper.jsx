// The original app gated AI/Pro features behind a subscription check here.
// The rebuild has a single free tier with everything unlocked, so this is
// just a pass-through — kept as a component so call sites don't need to change.
export default function AiFeatureWrapper({ children }) {
  return children;
}
