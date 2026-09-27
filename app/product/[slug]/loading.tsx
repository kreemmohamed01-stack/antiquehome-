export default function Loading() {
  return (
    <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        aria-hidden="true"
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: "2.5px solid rgba(201,162,39,.25)",
          borderTopColor: "#C9A227",
          animation: "pdpSpin .8s linear infinite",
        }}
      />
      <style>{`@keyframes pdpSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
