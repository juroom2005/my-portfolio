// src/components/drawings/oc/codex/CodexStyle.tsx
// Scoped responsive styles for the codex. Everything is namespaced under
// .occ-* so it can't leak. Fonts map to the repo's font vars + the two serif
// faces added in layout.tsx (Instrument Serif, Noto Serif KR).

export default function CodexStyle() {
  return (
    <style>{`
  .occ-root{ position:relative; display:flex; flex-direction:column; height:100dvh; background:#090A08; color:#EDEBE2; font-family:var(--font-sans); overflow:hidden; }
  .occ-serif{ font-family:"Instrument Serif",Georgia,serif; }
  .occ-kr{ font-family:"Noto Serif KR",var(--font-sans),serif; }
  .occ-grotesk{ font-family:var(--font-sans),system-ui,sans-serif; }
  .occ-mono{ font-family:var(--font-mono),ui-monospace,monospace; }

  .occ-topbar{ background:#0B0C0A; border-bottom:1px solid rgba(237,235,226,0.10); padding:11px 22px; display:flex; justify-content:space-between; align-items:center; gap:12px; z-index:10; }

  .occ-body{ flex:1; display:flex; min-height:0; }
  .occ-rail{ width:260px; flex-shrink:0; background:#0B0C0A; border-right:1px solid rgba(237,235,226,0.10); display:flex; flex-direction:column; overflow:hidden; }
  .occ-rail-head{ padding:20px 22px 16px; }
  .occ-rail-list{ flex:1; overflow-y:auto; padding:4px 14px 18px; }
  .occ-rail-item{ display:flex; align-items:center; gap:13px; width:100%; text-align:left; padding:11px 12px; margin-bottom:2px; background:transparent; border:none; border-bottom:1px solid rgba(237,235,226,0.10); position:relative; color:inherit; cursor:pointer; transition:padding-left .25s ease; }
  .occ-rail-item:first-child{ border-top:1px solid rgba(237,235,226,0.10); }

  .occ-main{ flex:1; overflow-y:auto; scroll-snap-type:y mandatory; }
  .occ-snap{ height:100%; scroll-snap-align:start; display:flex; }
  .occ-snap-end{ min-height:100%; scroll-snap-align:start; }

  .occ-stage{ flex:1; position:relative; overflow:hidden; color:#EDEBE2;
    background:radial-gradient(120% 90% at 38% 22%, #15170F 0%, #0C0D0B 60%, #090A08 100%);
    display:grid; grid-template-columns:74px minmax(280px,360px) 1fr; grid-template-rows:1fr 132px;
    grid-template-areas:"idx plate detail" "idx plate foot"; }
  .occ-idx{ position:relative; display:flex; flex-direction:column; justify-content:space-between; align-items:center; padding:34px 0 28px; border-right:1px solid rgba(237,235,226,0.07); }
  .occ-idx-vert{ writing-mode:vertical-rl; transform:rotate(180deg); white-space:nowrap; }
  .occ-plate-zone{ position:relative; display:flex; align-items:center; justify-content:center; padding:40px 8px 24px; min-height:0; }
  .occ-plate{ position:relative; width:320px; max-width:100%; height:100%; max-height:620px; display:flex; flex-direction:column; }
  .occ-plate-paper{ position:relative; z-index:1; flex:1; box-shadow:0 30px 60px rgba(0,0,0,0.45); display:flex; flex-direction:column; overflow:hidden; min-height:300px; }
  .occ-detail{ position:relative; padding:46px 56px 18px 48px; display:flex; flex-direction:column; overflow:hidden; }
  .occ-foot{ position:relative; border-top:1px solid rgba(237,235,226,0.10); display:grid; grid-template-columns:minmax(280px,420px) 1fr; align-items:center; }
  .occ-foot-tag{ padding:0 24px; border-right:1px solid rgba(237,235,226,0.10); height:100%; display:flex; flex-direction:column; justify-content:center; gap:8px; }
  .occ-foot-stats{ padding:0 48px; height:100%; display:flex; flex-direction:column; justify-content:center; gap:12px; }
  .occ-stat-grid{ display:grid; grid-template-columns:repeat(3,1fr); gap:11px 30px; width:100%; }

  .occ-dossier{ background:#0E0F0C; color:#EDEBE2; position:relative; padding:48px 64px 56px; }
  .occ-dossier-head{ display:flex; justify-content:space-between; align-items:flex-end; gap:20px; margin-bottom:30px; flex-wrap:wrap; }
  .occ-dossier-card{ display:grid; grid-template-columns:260px 1fr; gap:32px; background:rgba(237,235,226,0.03); border:1px solid rgba(237,235,226,0.10); padding:28px; }
  .occ-record{ display:grid; grid-template-columns:150px 1fr; }
  .occ-dossier-stats{ display:grid; grid-template-columns:repeat(2,1fr); gap:14px 36px; }

  @keyframes occRise{ from{opacity:0; transform:translateY(16px);} to{opacity:1; transform:none;} }
  .occ-anim{ animation:occRise .55s cubic-bezier(.2,.7,.2,1) both; }

  /* ---- Tablet ---- */
  @media (max-width:1100px){
    .occ-main{ scroll-snap-type:none; }
    .occ-snap{ height:auto; min-height:100%; }
    .occ-snap-end{ min-height:0; }
    .occ-stage{ overflow:visible; grid-template-columns:60px 1fr; grid-template-rows:auto auto auto;
      grid-template-areas:"idx detail" "idx plate" "idx foot"; }
    .occ-idx{ flex-direction:row; justify-content:space-between; padding:14px 18px; border-right:none; border-bottom:1px solid rgba(237,235,226,0.07); }
    .occ-idx-vert{ writing-mode:horizontal-tb; transform:none; }
    .occ-detail{ padding:34px 32px 18px; }
    .occ-plate-zone{ padding:8px 32px 28px; }
    .occ-plate{ width:340px; max-height:none; height:auto; }
    .occ-plate-paper{ min-height:420px; }
    .occ-foot{ grid-template-columns:1fr; }
    .occ-foot-tag{ border-right:none; border-bottom:1px solid rgba(237,235,226,0.10); padding:18px 24px; }
    .occ-foot-stats{ padding:18px 32px; }
  }

  /* ---- Mobile ---- */
  @media (max-width:760px){
    .occ-body{ flex-direction:column; }
    .occ-main{ scroll-snap-type:none; }
    .occ-snap{ height:auto; min-height:0; }
    .occ-rail{ width:100%; flex-direction:column; border-right:none; border-bottom:1px solid rgba(237,235,226,0.10); max-height:none; }
    .occ-rail-head{ display:none; }
    .occ-rail-list{ display:flex; flex-direction:row; gap:8px; overflow-x:auto; overflow-y:hidden; padding:10px 14px; }
    .occ-rail-item{ flex:0 0 auto; width:auto; border-bottom:none; border:1px solid rgba(237,235,226,0.12); margin-bottom:0; padding:8px 12px !important; }
    .occ-rail-item:first-child{ border-top:1px solid rgba(237,235,226,0.12); }
    .occ-stage{ grid-template-columns:1fr; grid-template-rows:auto auto auto auto;
      grid-template-areas:"idx" "detail" "plate" "foot"; }
    .occ-idx{ border-bottom:1px solid rgba(237,235,226,0.07); }
    .occ-detail{ padding:26px 20px 10px; }
    .occ-plate-zone{ padding:6px 20px 24px; }
    .occ-plate{ width:100%; max-width:320px; height:auto; max-height:none; margin:0 auto; }
    .occ-plate-paper{ min-height:340px; }
    .occ-stat-grid{ grid-template-columns:repeat(2,1fr); gap:11px 20px; }
    .occ-dossier{ padding:30px 20px 40px; }
    .occ-dossier-card{ grid-template-columns:1fr; gap:24px; padding:18px; }
    .occ-dossier-card > div:first-child{ max-width:240px; }
    .occ-dossier-stats{ grid-template-columns:1fr; }
    .occ-topbar-hint{ display:none !important; }
  }

  @media (prefers-reduced-motion: reduce){ .occ-anim{ animation:none; } }
  `}</style>
  );
}
