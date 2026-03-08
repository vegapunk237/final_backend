import { useState, useEffect, useRef, useMemo } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

const API_URL = 'https://dollar5665.pythonanywhere.com/api';

// ─── THEME STYLES ────────────────────────────────────────────────────────────
const getStyles = (theme) => {
  const isDark = theme === 'dark';
  return {
    container:          { minHeight: '100vh', background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative', paddingBottom: '40px', transition: 'background 0.3s ease' },
    bgDecor1:           { position: 'fixed', top: '-120px', right: '-120px', width: '420px', height: '420px', borderRadius: '50%', background: isDark ? 'radial-gradient(circle, rgba(253,216,53,0.12) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(253,216,53,0.18) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 },
    bgDecor2:           { position: 'fixed', bottom: '-160px', left: '-160px', width: '520px', height: '520px', borderRadius: '50%', background: isDark ? 'radial-gradient(circle, rgba(139,58,147,0.2) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(139,58,147,0.1) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 },

    header:             { background: isDark ? 'rgba(15,23,42,0.95)' : '#ffffff', backdropFilter: isDark ? 'blur(10px)' : 'none', borderBottom: isDark ? '1px solid rgba(253,216,53,0.2)' : '1px solid #e5e7eb', padding: '1.5rem 2rem', position: 'sticky', top: 0, zIndex: 100, boxShadow: isDark ? 'none' : '0 1px 8px rgba(0,0,0,0.06)', transition: 'all 0.3s ease' },
    headerContent:      { maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' },
    logoSection:        { display: 'flex', alignItems: 'center', gap: '1rem' },
    logoCircle:         { width: '50px', height: '50px', borderRadius: '50%', background: 'linear-gradient(135deg, #FDD835, #8B3A93)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: '#fff', boxShadow: '0 4px 15px rgba(253,216,53,0.4)' },
    brandName:          { fontSize: '1.5rem', fontWeight: 'bold', color: isDark ? '#FDD835' : '#111827', margin: 0 },
    brandTagline:       { fontSize: '0.9rem', color: isDark ? '#94a3b8' : '#6b7280', margin: 0 },
    headerActions:      { display: 'flex', gap: '0.75rem', alignItems: 'center' },
    themeToggle:        { padding: '0.6rem 1rem', background: isDark ? 'rgba(253,216,53,0.1)' : '#f3f4f6', border: isDark ? '1px solid rgba(253,216,53,0.3)' : '1px solid #e5e7eb', borderRadius: '8px', color: isDark ? '#FDD835' : '#374151', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' },
    refreshButton:      { padding: '0.6rem 1.2rem', background: isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff', color: isDark ? '#60a5fa' : '#2563eb', border: isDark ? '1px solid rgba(59,130,246,0.3)' : '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
    homeButton:         { padding: '0.6rem 1.2rem', background: isDark ? 'rgba(253,216,53,0.15)' : '#fffbeb', color: isDark ? '#FDD835' : '#92400e', border: isDark ? '1px solid rgba(253,216,53,0.3)' : '1px solid #fde68a', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },
    logoutButton:       { padding: '0.6rem 1.2rem', background: isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2', color: isDark ? '#f87171' : '#dc2626', border: isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem' },

    welcomeBanner:      { maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem' },
    welcomeContent:     { background: isDark ? 'linear-gradient(135deg, rgba(253,216,53,0.12), rgba(139,58,147,0.1))' : 'linear-gradient(135deg, #1e1b4b 0%, #6d28d9 100%)', border: isDark ? '1px solid rgba(253,216,53,0.3)' : 'none', borderRadius: '16px', padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: isDark ? 'none' : '0 10px 40px rgba(109,40,217,0.25)' },
    welcomeTitle:       { fontSize: '2rem', fontWeight: 'bold', color: '#FDD835', margin: '0 0 0.5rem 0' },
    welcomeSubtitle:    { fontSize: '1rem', color: isDark ? '#cbd5e1' : 'rgba(255,255,255,0.85)', margin: 0 },
    bannerDecor:        { fontSize: '4rem' },

    errorAlertContainer:{ maxWidth: '1400px', margin: '1rem auto 0', padding: '0 2rem' },
    errorAlert:         { background: isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2', border: isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid #fecaca', borderRadius: '12px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', color: isDark ? '#f87171' : '#dc2626' },
    closeErrorBtn:      { marginLeft: 'auto', background: 'transparent', border: 'none', color: isDark ? '#f87171' : '#dc2626', fontSize: '1.5rem', cursor: 'pointer' },

    statsSection:       { maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem' },
    statsGrid:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' },
    statCard:           { background: isDark ? 'rgba(15,23,42,0.8)' : '#ffffff', borderRadius: '14px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)', border: isDark ? 'none' : '1px solid #e5e7eb', transition: 'all 0.3s ease' },
    statIcon:           { fontSize: '2rem' },
    statLabel:          { color: isDark ? '#94a3b8' : '#6b7280', fontSize: '0.9rem', margin: 0 },
    statValue:          { color: isDark ? '#FDD835' : '#111827', fontSize: '1.8rem', fontWeight: 'bold', margin: 0 },

    tabsSection:        { maxWidth: '1400px', margin: '2rem auto 1rem', padding: '0 2rem' },
    tabsContainer:      { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', background: isDark ? 'transparent' : '#ffffff', padding: isDark ? '0' : '6px', borderRadius: isDark ? '0' : '14px', border: isDark ? 'none' : '1px solid #e5e7eb', boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)' },
    tab:                { flex: 1, minWidth: '180px', padding: '1rem', borderRadius: '12px', border: isDark ? '1px solid rgba(148,163,184,0.2)' : 'none', background: isDark ? 'rgba(15,23,42,0.7)' : 'transparent', color: isDark ? '#cbd5e1' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.95rem', fontWeight: '600', transition: 'all 0.2s' },
    tabActive:          { background: 'linear-gradient(135deg, #FDD835, #F9A825)', color: '#0f172a', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(253,216,53,0.3)', border: 'none' },
    tabIcon:            { fontSize: '1.2rem' },
    tabBadge:           { background: isDark ? 'rgba(0,0,0,0.25)' : '#f3f4f6', color: isDark ? '#FDD835' : '#374151', borderRadius: '999px', padding: '0.2rem 0.6rem', fontSize: '0.8rem' },
    tabBadgeDanger:     { background: '#ef4444', color: '#fff' },

    mainContent:        { maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem' },
    contentSection:     { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
    sectionTitle:       { color: isDark ? '#FDD835' : '#111827', fontSize: '1.6rem', marginBottom: '0.5rem' },

    courseCard:         { background: isDark ? 'rgba(15,23,42,0.85)' : '#ffffff', border: isDark ? '1px solid rgba(148,163,184,0.15)' : '1px solid #e5e7eb', borderRadius: '16px', padding: '1.5rem', boxShadow: isDark ? '0 15px 30px rgba(0,0,0,0.35)' : '0 4px 16px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'all 0.3s ease' },
    courseHeader:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' },
    badgeGroup:         { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' },
    courseSubject:      { color: isDark ? '#FDD835' : '#111827', margin: 0, fontWeight: '700', fontSize: '1.1rem' },
    courseStudent:      { color: isDark ? '#cbd5e1' : '#374151', margin: '0.2rem 0', fontSize: '0.95rem' },
    courseParent:       { color: isDark ? '#94a3b8' : '#6b7280', margin: 0, fontSize: '0.9rem' },
    badge:              { padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '600' },
    courseDetails:      { display: 'flex', flexWrap: 'wrap', gap: '1rem', color: isDark ? '#cbd5e1' : '#374151', background: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb', padding: '0.75rem 1rem', borderRadius: '10px', border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f3f4f6' },
    courseDetail:       { fontSize: '0.95rem' },
    infoSection:        { background: isDark ? 'rgba(30,41,59,0.6)' : '#f9fafb', borderRadius: '10px', padding: '1rem', border: isDark ? 'none' : '1px solid #f3f4f6' },
    infoLabel:          { color: isDark ? '#FDD835' : '#374151', fontSize: '0.85rem', marginBottom: '0.2rem', fontWeight: '600' },
    infoValue:          { color: isDark ? '#cbd5e1' : '#6b7280', marginBottom: '0.5rem', fontSize: '0.9rem' },

    videoButton:        { padding: '0.8rem 1.2rem', borderRadius: '12px', border: 'none', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
    videoButtonActive:  { background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', boxShadow: '0 8px 30px rgba(34,197,94,0.4)' },
    videoButtonDisabled:{ background: isDark ? 'rgba(100,116,139,0.2)' : '#f1f5f9', color: isDark ? '#475569' : '#94a3b8', cursor: 'not-allowed', border: isDark ? '1px solid rgba(100,116,139,0.3)' : '1px solid #e2e8f0' },
    actionButtons:      { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
    completeButton:     { background: isDark ? '#8B3A93' : 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', border: 'none', padding: '0.7rem 1.2rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' },
    manageButton:       { padding: '0.7rem 1.2rem', background: isDark ? 'rgba(253,216,53,0.1)' : '#fffbeb', border: isDark ? '1px solid rgba(253,216,53,0.3)' : '1px solid #fde68a', borderRadius: '10px', color: isDark ? '#FDD835' : '#92400e', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' },
    cancelActionButton: { padding: '0.7rem 1.2rem', background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid #fecaca', borderRadius: '10px', color: isDark ? '#fca5a5' : '#dc2626', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' },
    remarkButton:       { padding: '0.7rem 1.4rem', background: isDark ? 'linear-gradient(135deg, rgba(139,58,147,0.3), rgba(147,51,234,0.3))' : '#f5f3ff', border: isDark ? '1px solid rgba(147,51,234,0.4)' : '1px solid #ddd6fe', borderRadius: '12px', color: isDark ? '#a78bfa' : '#7c3aed', fontSize: '0.95rem', fontWeight: '600', cursor: 'pointer' },
    amountBadge:        { padding: '0.4rem 0.9rem', background: isDark ? 'rgba(253,216,53,0.15)' : '#fffbeb', color: isDark ? '#FDD835' : '#92400e', borderRadius: '999px', fontWeight: '600', fontSize: '0.9rem', border: isDark ? 'none' : '1px solid #fde68a' },

    validationSection:  { background: isDark ? 'rgba(30,41,59,0.6)' : '#f9fafb', borderRadius: '10px', padding: '1rem', border: isDark ? 'none' : '1px solid #f3f4f6' },
    validationTitle:    { color: isDark ? '#FDD835' : '#374151', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '600' },
    validationStatus:   { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    validationItem:     { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    validationLabel:    { color: isDark ? '#cbd5e1' : '#6b7280', fontSize: '0.9rem' },
    validated:          { color: '#22c55e', fontWeight: 'bold', fontSize: '1.1rem' },
    notValidated:       { color: isDark ? '#94a3b8' : '#9ca3af', fontSize: '1.1rem' },
    successMessage:     { marginTop: '0.5rem', padding: '0.6rem', background: isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7', borderRadius: '8px', color: '#22c55e', fontSize: '0.9rem', textAlign: 'center' },
    remarksDisplay:     { background: isDark ? 'rgba(30,41,59,0.6)' : '#f9fafb', borderRadius: '10px', padding: '1rem', border: isDark ? 'none' : '1px solid #f3f4f6' },
    remarksTitle:       { color: isDark ? '#FDD835' : '#374151', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '600' },
    remarkItem:         { color: isDark ? '#cbd5e1' : '#6b7280', fontSize: '0.9rem', marginBottom: '0.3rem' },

    loadingContainer:   { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', gap: '1rem' },
    spinner:            { width: '40px', height: '40px', border: `4px solid ${isDark ? 'rgba(253,216,53,0.2)' : '#e5e7eb'}`, borderTop: `4px solid ${isDark ? '#FDD835' : '#6d28d9'}`, borderRadius: '50%', animation: 'spin 1s linear infinite' },
    loadingText:        { color: isDark ? '#94a3b8' : '#6b7280' },
    emptyState:         { textAlign: 'center', padding: '3rem', color: isDark ? '#94a3b8' : '#6b7280' },
    emptyIcon:          { fontSize: '3rem', display: 'block', marginBottom: '1rem' },

    messageCard:        { background: isDark ? 'rgba(15,23,42,0.85)' : '#ffffff', borderRadius: '16px', padding: '1.5rem', border: isDark ? '1px solid rgba(148,163,184,0.15)' : '1px solid #e5e7eb', boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)' },
    messageCardUnread:  { borderColor: isDark ? 'rgba(253,216,53,0.4)' : '#fde68a', background: isDark ? 'rgba(253,216,53,0.04)' : '#fffef0' },
    messageHeader:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    messageAuthor:      { display: 'flex', alignItems: 'center', gap: '12px' },
    messageAvatar:      { fontSize: '2rem' },
    messageSender:      { fontSize: '1rem', fontWeight: '600', color: isDark ? '#FDD835' : '#111827', margin: '0 0 3px 0' },
    messageTime:        { fontSize: '0.8rem', color: isDark ? '#94a3b8' : '#9ca3af', margin: 0 },
    unreadDot:          { width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 },
    messageText:        { fontSize: '0.9rem', color: isDark ? '#cbd5e1' : '#374151', lineHeight: '1.6', marginBottom: '12px' },
    replyButton:        { padding: '0.6rem 1.2rem', background: isDark ? 'rgba(253,216,53,0.1)' : '#fffbeb', border: isDark ? '1px solid rgba(253,216,53,0.3)' : '1px solid #fde68a', borderRadius: '10px', color: isDark ? '#FDD835' : '#92400e', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
    repliesContainer:   { marginTop: '12px', paddingTop: '12px', borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' },
    replyCard:          { background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb', borderRadius: '12px', padding: '12px 14px', borderLeft: isDark ? '3px solid rgba(253,216,53,0.3)' : '3px solid #fde68a' },

    filesSection:       { marginTop: '14px', borderTop: isDark ? '1px solid rgba(148,163,184,0.1)' : '1px solid #f3f4f6', paddingTop: '14px' },
    filesToggleBtn:     { width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: isDark ? 'rgba(253,216,53,0.07)' : '#fffbeb', border: isDark ? '1px solid rgba(253,216,53,0.2)' : '1px solid #fde68a', borderRadius: '10px', color: isDark ? '#FDD835' : '#92400e', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    filesCount:         { background: isDark ? 'rgba(253,216,53,0.15)' : '#fef3c7', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', color: isDark ? '#FDD835' : '#92400e' },
    filesPanel:         { marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' },
    uploadZone:         { border: isDark ? '2px dashed rgba(253,216,53,0.3)' : '2px dashed #e5e7eb', borderRadius: '12px', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: isDark ? 'rgba(253,216,53,0.04)' : '#f9fafb', transition: 'border-color 0.2s' },
    uploadZoneText:     { color: isDark ? '#94a3b8' : '#6b7280', fontSize: '13px', margin: 0 },
    uploadBtn:          { display: 'inline-block', padding: '8px 20px', background: isDark ? 'rgba(253,216,53,0.15)' : '#fffbeb', border: isDark ? '1px solid rgba(253,216,53,0.4)' : '1px solid #fde68a', borderRadius: '8px', color: isDark ? '#FDD835' : '#92400e', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    uploadDescInput:    { width: '100%', padding: '8px 12px', background: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb', borderRadius: '8px', color: isDark ? '#d1d5db' : '#374151', fontSize: '12px', outline: 'none', boxSizing: 'border-box', marginTop: '4px' },
    uploadHint:         { fontSize: '11px', color: isDark ? '#64748b' : '#9ca3af', margin: 0 },
    fileItem:           { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb', borderRadius: '10px', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e5e7eb' },
    fileName:           { fontSize: '13px', fontWeight: '600', margin: '0 0 3px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    fileMeta:           { fontSize: '11px', color: isDark ? '#64748b' : '#9ca3af', margin: 0 },
    fileDesc:           { fontSize: '11px', color: isDark ? '#94a3b8' : '#6b7280', margin: '3px 0 0 0', fontStyle: 'italic' },
    fileActions:        { display: 'flex', gap: '6px', flexShrink: 0 },
    downloadBtn:        { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7', border: isDark ? '1px solid rgba(34,197,94,0.3)' : '1px solid #bbf7d0', borderRadius: '8px', fontSize: '14px', textDecoration: 'none', cursor: 'pointer' },
    deleteFileBtn:      { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2', border: isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' },

    earningsSummary:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
    summaryCard:        { background: isDark ? 'rgba(15,23,42,0.8)' : '#ffffff', borderRadius: '12px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', border: isDark ? '1px solid rgba(253,216,53,0.15)' : '1px solid #e5e7eb', boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.05)' },
    summaryLabel:       { color: isDark ? '#94a3b8' : '#6b7280', fontSize: '0.85rem' },
    summaryValue:       { color: isDark ? '#FDD835' : '#111827', fontSize: '1.6rem', fontWeight: 'bold' },
    earningsList:       { display: 'flex', flexDirection: 'column', gap: '1rem' },
    earningCard:        { background: isDark ? 'rgba(15,23,42,0.8)' : '#ffffff', borderRadius: '12px', padding: '1.2rem', border: isDark ? '1px solid rgba(148,163,184,0.15)' : '1px solid #e5e7eb', boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)' },
    earningHeader:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' },
    earningMonth:       { color: isDark ? '#cbd5e1' : '#374151', margin: 0, fontWeight: '600' },
    earningAmount:      { color: isDark ? '#FDD835' : '#111827', fontWeight: 'bold', fontSize: '1.2rem' },
    earningDetails:     { display: 'flex', justifyContent: 'space-between', color: isDark ? '#94a3b8' : '#9ca3af', fontSize: '0.85rem', marginBottom: '0.6rem' },
    progressBarTrack:   { background: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb', borderRadius: '999px', height: '8px', overflow: 'hidden' },
    progressBarFill:    { height: '100%', background: 'linear-gradient(90deg, #FDD835, #F9A825)', borderRadius: '999px' },

    videoModal:         { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' },
    videoContainer:     { background: '#0f172a', borderRadius: '20px', width: '100%', maxWidth: '1400px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(253,216,53,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' },
    videoHeader:        { padding: '16px 24px', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(253,216,53,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
    videoHeaderInfo:    { flex: 1 },
    videoTitle:         { fontSize: '18px', fontWeight: 'bold', color: '#FDD835', margin: '0 0 4px 0' },
    videoSubtitle:      { fontSize: '13px', color: '#9ca3af', margin: 0 },
    videoCloseBtn:      { width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    wbToggleBtn:        { padding: '8px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#d1d5db', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },

    modalOverlay:       { position: 'fixed', inset: 0, background: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
    modalContent:       { background: isDark ? 'rgba(15,23,42,0.98)' : '#ffffff', backdropFilter: isDark ? 'blur(20px)' : 'none', borderRadius: '24px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto', border: isDark ? '1px solid rgba(253,216,53,0.3)' : '1px solid #e5e7eb', boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.6)' : '0 20px 60px rgba(0,0,0,0.15)' },
    modalHeader:        { padding: '25px 30px', borderBottom: isDark ? '1px solid rgba(253,216,53,0.2)' : '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDark ? 'rgba(139,58,147,0.15)' : '#f9fafb', borderRadius: '24px 24px 0 0' },
    modalTitle:         { fontSize: '22px', fontWeight: '700', color: isDark ? '#FDD835' : '#111827', margin: 0 },
    modalClose:         { width: '40px', height: '40px', borderRadius: '50%', background: isDark ? 'rgba(239,68,68,0.2)' : '#fef2f2', border: isDark ? '1px solid rgba(239,68,68,0.4)' : '1px solid #fecaca', color: isDark ? '#fca5a5' : '#dc2626', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modalBody:          { padding: '30px', display: 'flex', flexDirection: 'column', gap: '1rem' },
    modalFooter:        { padding: '20px 30px', borderTop: isDark ? '1px solid rgba(253,216,53,0.2)' : '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: '12px' },
    formGroup:          { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    formLabel:          { fontSize: '14px', fontWeight: '600', color: isDark ? '#FDD835' : '#374151' },
    formInput:          { width: '100%', padding: '12px 16px', background: isDark ? 'rgba(255,255,255,0.08)' : '#f9fafb', border: isDark ? '1px solid rgba(253,216,53,0.3)' : '1px solid #e5e7eb', borderRadius: '10px', color: isDark ? '#fff' : '#111827', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    formTextarea:       { width: '100%', minHeight: '80px', padding: '12px 16px', background: isDark ? 'rgba(255,255,255,0.08)' : '#f9fafb', border: isDark ? '1px solid rgba(253,216,53,0.3)' : '1px solid #e5e7eb', borderRadius: '10px', color: isDark ? '#fff' : '#111827', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
    starButton:         { background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' },
    currentInfo:        { padding: '15px', background: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', borderRadius: '12px', border: isDark ? '1px solid rgba(59,130,246,0.3)' : '1px solid #bfdbfe' },
    currentLabel:       { fontSize: '13px', color: '#60a5fa', marginBottom: '6px', fontWeight: '600' },
    currentValue:       { fontSize: '16px', color: isDark ? '#e5e7eb' : '#374151', margin: 0 },
    warningBox:         { padding: '15px', background: isDark ? 'rgba(251,191,36,0.1)' : '#fffbeb', borderRadius: '12px', border: isDark ? '1px solid rgba(251,191,36,0.3)' : '1px solid #fde68a', display: 'flex', alignItems: 'flex-start', gap: '12px' },
    warningText:        { fontSize: '13px', color: isDark ? '#fbbf24' : '#92400e', margin: 0, lineHeight: '1.6' },
    dangerBox:          { padding: '15px', background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', borderRadius: '12px', border: isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid #fecaca', display: 'flex', alignItems: 'flex-start', gap: '12px', marginTop: '10px' },
    dangerTitle:        { fontSize: '15px', fontWeight: 'bold', color: isDark ? '#fca5a5' : '#dc2626', marginBottom: '8px' },
    dangerText:         { fontSize: '13px', color: isDark ? '#fca5a5' : '#b91c1c', margin: 0, lineHeight: '1.6' },
    cancelInfo:         { padding: '20px', background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb', borderRadius: '12px', textAlign: 'center', border: isDark ? 'none' : '1px solid #e5e7eb' },
    cancelCourseTitle:  { fontSize: '20px', fontWeight: 'bold', color: isDark ? '#FDD835' : '#111827', marginBottom: '10px' },
    cancelCourseDetails:{ fontSize: '14px', color: isDark ? '#9ca3af' : '#6b7280', lineHeight: '1.6', margin: 0 },
    cancelModalBtn:     { padding: '12px 24px', background: isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6', border: isDark ? '1px solid rgba(253,216,53,0.3)' : '1px solid #e5e7eb', borderRadius: '12px', color: isDark ? '#FDD835' : '#374151', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
    confirmBtn:         { padding: '12px 24px', background: 'linear-gradient(135deg, #FDD835, #FFC107)', border: 'none', borderRadius: '12px', color: '#0f172a', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
    dangerBtn:          { padding: '12px 24px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer' },
  };
};

const TeacherDashboard = ({ navigate, user, onLogout }) => {
  const [theme, setTheme]                 = useState('dark');
  const [activeTab, setActiveTab]         = useState('appointments');
  const [appointments, setAppointments]   = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');

  const [showRemarkModal, setShowRemarkModal]         = useState(false);
  const [showVideoConference, setShowVideoConference] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal]         = useState(false);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [remarkData, setRemarkData]         = useState({ studentBehavior: '', progress: '', suggestions: '', rating: 5 });
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '', reason: '' });

  const zegoContainerRef = useRef(null);

  const [courseFiles, setCourseFiles]     = useState({});
  const [filesLoading, setFilesLoading]   = useState({});
  const [uploadingFile, setUploadingFile] = useState({});
  const [uploadDesc, setUploadDesc]       = useState('');
  const [expandedFiles, setExpandedFiles] = useState({});

  const [messages, setMessages]             = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyingTo, setReplyingTo]         = useState(null);
  const [replyContents, setReplyContents]   = useState({});
  const [sendingReply, setSendingReply]     = useState({});

  // Compute styles based on current theme
  const styles = getStyles(theme);
  const isDark = theme === 'dark';

  const earnings = useMemo(() => {
    const byMonth = {};
    completedCourses.forEach(course => {
      const d = new Date(course.date);
      if (isNaN(d)) return;
      const key = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      if (!byMonth[key]) byMonth[key] = { month: key, amount: 0, hours: 0, _ts: d.getTime() };
      byMonth[key].amount += Number(course.amount) || 0;
      byMonth[key].hours  += parseFloat(String(course.duration).replace('h', '')) || 0;
    });
    return Object.values(byMonth).sort((a, b) => b._ts - a._ts).slice(0, 6);
  }, [completedCourses]);

  const totalEarnings  = earnings.reduce((s, e) => s + e.amount, 0);
  const totalHours     = earnings.reduce((s, e) => s + e.hours, 0);
  const avgRate        = totalHours > 0 ? (totalEarnings / totalHours).toFixed(2) : '0.00';
  const maxHours       = Math.max(...earnings.map(e => e.hours), 1);

  const fetchMessages = async () => {
    setMessagesLoading(true);
    try {
      const res  = await fetch(`${API_URL}/messages/?user_type=teacher`);
      const data = await res.json();
      if (data.success) setMessages(data.data);
      else setMessages([]);
    } catch(e) { console.error('Erreur messages:', e); setMessages([]); }
    finally { setMessagesLoading(false); }
  };

  const handleSendReply = async (msgId) => {
    const content = (replyContents[msgId] || '').trim();
    if (!content) return;
    setSendingReply(prev => ({ ...prev, [msgId]: true }));
    try {
      const res = await fetch(`${API_URL}/messages/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderType:      'teacher',
          senderId:        String(user?.id || ''),
          senderName:      user?.name || 'Enseignant',
          content,
          parentMessageId: msgId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m =>
          m.id !== msgId ? m : { ...m, replies: [...(m.replies || []), data.data] }
        ));
        setReplyContents(prev => ({ ...prev, [msgId]: '' }));
        setReplyingTo(null);
      } else { alert('❌ ' + (data.message || "Erreur lors de l'envoi")); }
    } catch(e) { alert('❌ Erreur de connexion'); }
    finally { setSendingReply(prev => ({ ...prev, [msgId]: false })); }
  };

  const fetchCourseFiles = async (courseId) => {
    setFilesLoading(prev => ({ ...prev, [courseId]: true }));
    try {
      const res  = await fetch(`${API_URL}/appointments/${courseId}/files/`);
      const data = await res.json();
      if (data.success) setCourseFiles(prev => ({ ...prev, [courseId]: data.data }));
    } catch(e) { console.error('Erreur fichiers:', e); }
    finally { setFilesLoading(prev => ({ ...prev, [courseId]: false })); }
  };

  const toggleFiles = (courseId) => {
    setExpandedFiles(prev => {
      const next = !prev[courseId];
      if (next && !courseFiles[courseId]) fetchCourseFiles(courseId);
      return { ...prev, [courseId]: next };
    });
  };

  const handleFileUpload = async (courseId, file) => {
    if (!file) return;
    const ALLOWED_EXT = ['pdf','jpg','jpeg','png','gif','webp','doc','docx','xls','xlsx'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) { alert('❌ Type non autorisé.'); return; }
    if (file.size > 20 * 1024 * 1024) { alert('❌ Fichier trop lourd (max 20 MB)'); return; }
    setUploadingFile(prev => ({ ...prev, [courseId]: true }));
    try {
      const formData = new FormData();
      formData.append('file',          file);
      formData.append('uploaded_by',   'teacher');
      formData.append('uploader_name', user?.name || 'Enseignant');
      formData.append('description',   uploadDesc);
      const res  = await fetch(`${API_URL}/appointments/${courseId}/files/`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setCourseFiles(prev => ({ ...prev, [courseId]: [data.data, ...(prev[courseId] || [])] }));
        setUploadDesc('');
      } else { alert('❌ ' + data.message); }
    } catch(e) { alert('❌ Erreur de connexion'); }
    finally { setUploadingFile(prev => ({ ...prev, [courseId]: false })); }
  };

  const handleDeleteFile = async (courseId, fileId) => {
    if (!window.confirm('Supprimer ce fichier ?')) return;
    try {
      const res  = await fetch(`${API_URL}/files/${fileId}/`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) setCourseFiles(prev => ({ ...prev, [courseId]: prev[courseId].filter(f => f.id !== fileId) }));
    } catch(e) { alert('❌ Erreur'); }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024)        return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  };

  useEffect(() => {
    if (!showVideoConference || !selectedCourse || !zegoContainerRef.current) return;
    const appID        = parseInt(import.meta.env.VITE_ZEGO_APP_ID);
    const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;
    const roomID       = `kh_course_${selectedCourse.id}`;
    const userID       = `teacher_${user?.id || Date.now()}`;
    const userName     = user?.name || 'Enseignant';
    const kitToken     = ZegoUIKitPrebuilt.generateKitTokenForTest(appID, serverSecret, roomID, userID, userName);
    const zp           = ZegoUIKitPrebuilt.create(kitToken);
    zp.joinRoom({
      container: zegoContainerRef.current,
      scenario:  { mode: ZegoUIKitPrebuilt.GroupCall },
      showScreenSharingButton: true,
      showTextChat:  true,
      showUserList:  true,
      onLeaveRoom:   () => setShowVideoConference(false),
    });
    return () => zp.destroy();
  }, [showVideoConference, selectedCourse]);

  useEffect(() => {
    if (user?.id) {
      fetchTeacherAppointments();
      fetchCompletedCourses();
      fetchMessages();
    }
  }, [user]);

  const fetchTeacherAppointments = async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API_URL}/appointments/`);
      const data = await res.json();
      if (data.success) {
        setAppointments((data.data || []).filter(a =>
          String(a.assignedTeacherId) === String(user.id) &&
          (a.status === 'assigned' || a.status === 'confirmed')
        ));
      } else { setError('Erreur lors du chargement des rendez-vous'); }
    } catch { setError('Impossible de se connecter au serveur.'); }
    finally  { setLoading(false); }
  };

  const fetchCompletedCourses = async () => {
    try {
      const res  = await fetch(`${API_URL}/appointments/`);
      const data = await res.json();
      if (data.success) {
        setCompletedCourses((data.data || [])
          .filter(a => String(a.assignedTeacherId) === String(user.id) && a.status === 'completed')
          .map(a => ({
            id: a.id, subject: a.subject, student: a.studentName, studentAvatar: '👦',
            parent: a.parentName, date: a.preferredDate, time: a.preferredTime?.slice(0, 5) || '00:00',
            duration: `${a.duration}h`, amount: parseFloat(a.totalAmount) || 0,
            status: a.status, validated: { parent: false, teacher: true }, teacherRemarks: null,
          }))
        );
      }
    } catch(err) { console.error('❌ Erreur cours terminés:', err); }
  };

  const handleJoinVideo = (apt) => { setSelectedCourse(apt); setShowVideoConference(true); };

  // ── Horloge en temps réel (mise à jour chaque minute) ─────────────────────
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  /**
   * Retourne true si on est dans la fenêtre d'accès à la visio :
   *   - De 60 min AVANT le début du cours
   *   - Jusqu'à la fin estimée (durée incluse + 30 min de marge)
   */
  const isVideoAvailable = (date, time, duration = 1) => {
    if (!date || !time) return false;
    const [h, m]   = String(time).slice(0, 5).split(':').map(Number);
    const start    = new Date(date);
    start.setHours(h, m, 0, 0);
    const durationH = parseFloat(String(duration).replace('h', '')) || 1;
    const end      = new Date(start.getTime() + (durationH + 0.5) * 3600_000);
    const earliest = new Date(start.getTime() - 3600_000);
    return now >= earliest && now <= end;
  };

  const handleConfirmAppointment = async (id) => {
    if (!window.confirm('Confirmer ce rendez-vous ?')) return;
    try {
      const res  = await fetch(`${API_URL}/appointments/${id}/status/`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'confirmed' }) });
      const data = await res.json();
      if (data.success) { setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed' } : a)); alert('✅ Rendez-vous confirmé !'); }
      else { alert('❌ Erreur: ' + data.message); }
    } catch { alert('❌ Erreur de connexion'); }
  };

  const handleCompleteCourse = async (id) => {
    if (!window.confirm('Marquer ce cours comme terminé ?')) return;
    try {
      const res  = await fetch(`${API_URL}/appointments/${id}/status/`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'completed' }) });
      const data = await res.json();
      if (data.success) {
        const done = appointments.find(a => a.id === id);
        if (done) {
          setCompletedCourses(prev => [...prev, {
            id: done.id, subject: done.subject, student: done.studentName, studentAvatar: '👦',
            parent: done.parentName, date: done.preferredDate, time: done.preferredTime?.slice(0, 5),
            duration: `${done.duration}h`, amount: parseFloat(done.totalAmount) || 0,
            status: 'completed', validated: { parent: false, teacher: true }, teacherRemarks: null,
          }]);
          setAppointments(prev => prev.filter(a => a.id !== id));
        }
        alert('✅ Cours marqué comme terminé !');
      } else { alert('❌ Erreur: ' + data.message); }
    } catch { alert('❌ Erreur de connexion'); }
  };

  const handleOpenRemarkModal   = (course) => { setSelectedCourse(course); setRemarkData(course.teacherRemarks || { studentBehavior: '', progress: '', suggestions: '', rating: 5 }); setShowRemarkModal(true); };
  const handleSaveRemarks       = () => { setCompletedCourses(prev => prev.map(c => c.id === selectedCourse.id ? { ...c, teacherRemarks: remarkData } : c)); setShowRemarkModal(false); alert('✅ Remarques enregistrées !'); };
  const handleReschedule        = (apt) => { setSelectedCourse(apt); setRescheduleData({ date: apt.preferredDate || '', time: apt.preferredTime?.slice(0, 5) || '', reason: '' }); setShowRescheduleModal(true); };
  const confirmReschedule       = () => { setShowRescheduleModal(false); alert('📆 Demande de report envoyée au parent !'); };
  const handleCancelAppointment = (apt) => { setSelectedCourse(apt); setShowCancelModal(true); };
  const confirmCancel           = () => { setAppointments(prev => prev.filter(a => a.id !== selectedCourse.id)); setShowCancelModal(false); alert('❌ Cours annulé.'); };

  const getStatusBadge = (status) => {
    const config = {
      assigned:  { bg: isDark ? 'rgba(59,130,246,0.2)' : '#dbeafe',  color: '#3b82f6',  icon: '👨‍🏫', label: 'Assigné' },
      confirmed: { bg: isDark ? 'rgba(34,197,94,0.2)' : '#dcfce7',   color: '#22c55e',  icon: '✓',    label: 'Confirmé' },
      completed: { bg: isDark ? 'rgba(139,58,147,0.2)' : '#f3e8ff',  color: '#8B3A93',  icon: '✅',   label: 'Terminé' },
      cancelled: { bg: isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2',   color: '#ef4444',  icon: '✗',    label: 'Annulé' },
    };
    const { bg, color, icon, label } = config[status] || config.assigned;
    return <span style={{ ...styles.badge, background: bg, color }}>{icon} {label}</span>;
  };

  const pendingCount   = appointments.filter(a => a.status === 'assigned').length;
  const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
  const unreadMessages = messages.filter(m => !m.is_read && m.sender_type === 'parent').length;

  const openWhiteboardTab = (course) => {
    const name = encodeURIComponent(`${course.subject} — ${course.studentName || ''}`);
    window.open(`/whiteboard.html?course=${name}`, '_blank', 'width=1200,height=750,toolbar=0,menubar=0');
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgDecor1} /><div style={styles.bgDecor2} />

      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoSection}>
            <div style={styles.logoCircle}>KH</div>
            <div><h1 style={styles.brandName}>KH PERFECTION</h1><p style={styles.brandTagline}>Espace Enseignant</p></div>
          </div>
          <div style={styles.headerActions}>
            {/* THEME TOGGLE */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              style={styles.themeToggle}
              title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              <span style={{ fontSize: '18px' }}>{isDark ? '☀️' : '🌙'}</span>
              <span>{isDark ? 'Clair' : 'Sombre'}</span>
            </button>
            <button onClick={fetchTeacherAppointments} style={styles.refreshButton}>🔄 Actualiser</button>
            <button onClick={() => navigate('home')}   style={styles.homeButton}>🏠 Accueil</button>
            <button onClick={onLogout}                 style={styles.logoutButton}>🚪 Déconnexion</button>
          </div>
        </div>
      </header>

      {/* BANNIÈRE */}
      <section style={styles.welcomeBanner}>
        <div style={styles.welcomeContent}>
          <div><h2 style={styles.welcomeTitle}>Bienvenue, {user?.name} ! 👋</h2><p style={styles.welcomeSubtitle}>Gérez vos cours, communiquez avec les parents et suivez vos revenus</p></div>
          <div style={styles.bannerDecor}>🎓</div>
        </div>
      </section>

      {error && (
        <div style={styles.errorAlertContainer}>
          <div style={styles.errorAlert}><span>⚠️</span><span>{error}</span><button onClick={() => setError('')} style={styles.closeErrorBtn}>✕</button></div>
        </div>
      )}

      {/* STATS */}
      <section style={styles.statsSection}>
        <div style={styles.statsGrid}>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #3b82f6' }}><div style={styles.statIcon}>📅</div><div><p style={styles.statLabel}>En attente</p><p style={styles.statValue}>{pendingCount}</p></div></div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #22c55e' }}><div style={styles.statIcon}>✅</div><div><p style={styles.statLabel}>Confirmés</p><p style={styles.statValue}>{confirmedCount}</p></div></div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #FDD835' }}><div style={styles.statIcon}>💰</div><div><p style={styles.statLabel}>Total gagné</p><p style={styles.statValue}>{totalEarnings.toFixed(0)}€</p></div></div>
          <div style={{ ...styles.statCard, borderLeft: '4px solid #8B3A93' }}><div style={styles.statIcon}>💬</div><div><p style={styles.statLabel}>Messages non lus</p><p style={styles.statValue}>{unreadMessages}</p></div></div>
        </div>
      </section>

      {/* ONGLETS */}
      <section style={styles.tabsSection}>
        <div style={styles.tabsContainer}>
          {[
            { key: 'appointments', icon: '📆', label: 'Mes Rendez-vous', badge: appointments.length },
            { key: 'completed',    icon: '✅', label: 'Cours Terminés',  badge: completedCourses.length },
            { key: 'messages',     icon: '💬', label: 'Messages',        badge: unreadMessages, danger: true },
            { key: 'earnings',     icon: '💰', label: 'Revenus' },
          ].map(({ key, icon, label, badge, danger }) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{ ...styles.tab, ...(activeTab === key ? styles.tabActive : {}) }}>
              <span style={styles.tabIcon}>{icon}</span><span>{label}</span>
              {badge !== undefined && badge > 0 && <span style={{ ...styles.tabBadge, ...(danger ? styles.tabBadgeDanger : {}) }}>{badge}</span>}
            </button>
          ))}
        </div>
      </section>

      {/* CONTENU */}
      <section style={styles.mainContent}>

        {/* ── RENDEZ-VOUS ── */}
        {activeTab === 'appointments' && (
          <div style={styles.contentSection}>
            <h3 style={styles.sectionTitle}>📆 Mes rendez-vous assignés</h3>
            {loading && <div style={styles.loadingContainer}><div style={styles.spinner} /><p style={styles.loadingText}>Chargement...</p></div>}
            {!loading && appointments.length === 0 && <div style={styles.emptyState}><span style={styles.emptyIcon}>📭</span><p>Aucun rendez-vous assigné.</p></div>}
            {!loading && appointments.map((apt) => {
              const timeStr = apt.preferredTime?.slice(0, 5) || '00:00';
              return (
                <div key={apt.id} style={styles.courseCard}>
                  <div style={styles.courseHeader}>
                    <div>
                      <h4 style={styles.courseSubject}>📚 {apt.subject} — {apt.level}</h4>
                      <p style={styles.courseStudent}>👦 Élève : {apt.studentName}</p>
                      <p style={styles.courseParent}>👤 Parent : {apt.parentName}</p>
                    </div>
                    <div style={styles.badgeGroup}>{getStatusBadge(apt.status)}</div>
                  </div>
                  <div style={styles.courseDetails}>
                    <span style={styles.courseDetail}>📅 {new Date(apt.preferredDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    <span style={styles.courseDetail}>🕐 {timeStr}</span>
                    <span style={styles.courseDetail}>⏱️ {apt.duration}h</span>
                    <span style={styles.courseDetail}>📍 {apt.location === 'online' ? '💻 En ligne' : '🏠 À domicile'}</span>
                  </div>
                  <div style={styles.infoSection}>
                    <p style={styles.infoLabel}>📧 Contact Parent</p><p style={styles.infoValue}>{apt.parentEmail}</p>
                    {apt.parentPhone && <><p style={styles.infoLabel}>📞 Téléphone</p><p style={styles.infoValue}>{apt.parentPhone}</p></>}
                    {apt.notes && <><p style={styles.infoLabel}>📝 Notes</p><p style={styles.infoValue}>{apt.notes}</p></>}
                  </div>
                  {(() => {
                    const available = isVideoAvailable(apt.preferredDate, apt.preferredTime, apt.duration);
                    return (
                      <button
                        onClick={() => available && handleJoinVideo(apt)}
                        disabled={!available}
                        title={available ? 'Démarrer la visio' : 'Disponible 1h avant le cours'}
                        style={{
                          ...styles.videoButton,
                          ...(available ? styles.videoButtonActive : styles.videoButtonDisabled),
                        }}
                      >
                        {available ? '📹 Démarrer la visio' : '🔒 Visio indisponible'}
                      </button>
                    );
                  })()}
                  <div style={styles.actionButtons}>
                    <button onClick={() => handleCompleteCourse(apt.id)} style={styles.completeButton}>✅ Marquer terminé</button>
                    <button onClick={() => handleReschedule(apt)}        style={styles.manageButton}>📆 Reporter</button>
                    <button onClick={() => handleCancelAppointment(apt)} style={styles.cancelActionButton}>❌ Annuler</button>
                  </div>

                  {/* FICHIERS */}
                  <div style={styles.filesSection}>
                    <button onClick={() => toggleFiles(apt.id)} style={styles.filesToggleBtn}>
                      <span>📎 Documents du cours</span>
                      <span style={styles.filesCount}>{courseFiles[apt.id] ? `${courseFiles[apt.id].length} fichier${courseFiles[apt.id].length !== 1 ? 's' : ''}` : 'Voir'}</span>
                      <span style={{ marginLeft: 'auto', transition: 'transform 0.2s', transform: expandedFiles[apt.id] ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                    </button>
                    {expandedFiles[apt.id] && (
                      <div style={styles.filesPanel}>
                        <div style={styles.uploadZone}
                          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#FDD835'; }}
                          onDragLeave={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(253,216,53,0.3)' : '#e5e7eb'; }}
                          onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = isDark ? 'rgba(253,216,53,0.3)' : '#e5e7eb'; const f = e.dataTransfer.files[0]; if(f) handleFileUpload(apt.id, f); }}
                        >
                          <span style={{ fontSize: '28px' }}>📤</span>
                          <p style={styles.uploadZoneText}>Partagez un document avec l'élève</p>
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx"
                            style={{ display: 'none' }} id={`file-input-t-${apt.id}`}
                            onChange={e => handleFileUpload(apt.id, e.target.files[0])}
                          />
                          <label htmlFor={`file-input-t-${apt.id}`} style={styles.uploadBtn}>
                            {uploadingFile[apt.id] ? '⏳ Envoi...' : '📁 Choisir un fichier'}
                          </label>
                          <input type="text" placeholder="Description (ex: Exercices chapitre 3)"
                            value={uploadDesc} onChange={e => setUploadDesc(e.target.value)}
                            style={styles.uploadDescInput}
                          />
                          <p style={styles.uploadHint}>PDF • Images • Word • Excel — max 20 Mo</p>
                        </div>
                        {filesLoading[apt.id] && <p style={{ textAlign:'center', color: isDark ? '#94a3b8' : '#6b7280', padding:'1rem' }}>⏳ Chargement...</p>}
                        {!filesLoading[apt.id] && courseFiles[apt.id]?.length === 0 && (
                          <p style={{ textAlign:'center', color: isDark ? '#64748b' : '#9ca3af', padding:'1rem', fontSize:'13px' }}>Aucun document partagé pour ce cours.</p>
                        )}
                        {(courseFiles[apt.id] || []).map(cf => {
                          const typeMap = { pdf:{icon:'📄',color:'#ef4444'}, image:{icon:'🖼️',color:'#3b82f6'}, word:{icon:'📝',color:'#2563eb'}, excel:{icon:'📊',color:'#16a34a'}, other:{icon:'📎',color:'#94a3b8'} };
                          const fi = typeMap[cf.file_type] || typeMap.other;
                          const uploaderLabel = cf.uploaded_by === 'parent' ? `👤 ${cf.uploader_name || 'Parent'}` : `👨‍🏫 ${cf.uploader_name || 'Enseignant'}`;
                          return (
                            <div key={cf.id} style={styles.fileItem}>
                              <span style={{ fontSize: '22px', flexShrink: 0 }}>{fi.icon}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ ...styles.fileName, color: fi.color }}>{cf.original_name}</p>
                                <p style={styles.fileMeta}>{formatFileSize(cf.file_size)} • {uploaderLabel} • {new Date(cf.uploaded_at).toLocaleDateString('fr-FR')}</p>
                                {cf.description && <p style={styles.fileDesc}>{cf.description}</p>}
                              </div>
                              <div style={styles.fileActions}>
                                <a href={`${API_URL}/files/${cf.id}/download/`} download={cf.original_name} style={styles.downloadBtn} title="Télécharger">⬇️</a>
                                <button onClick={() => handleDeleteFile(apt.id, cf.id)} style={styles.deleteFileBtn} title="Supprimer">🗑️</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── COURS TERMINÉS ── */}
        {activeTab === 'completed' && (
          <div style={styles.contentSection}>
            <h3 style={styles.sectionTitle}>✅ Cours terminés</h3>
            {completedCourses.length === 0 && <div style={styles.emptyState}><span style={styles.emptyIcon}>📭</span><p>Aucun cours terminé.</p></div>}
            {completedCourses.map((course) => (
              <div key={course.id} style={styles.courseCard}>
                <div style={styles.courseHeader}>
                  <div><h4 style={styles.courseSubject}>📚 {course.subject}</h4><p style={styles.courseStudent}>👦 {course.student}</p><p style={styles.courseParent}>👤 {course.parent}</p></div>
                  <div style={styles.amountBadge}>💰 {course.amount.toFixed(2)}€</div>
                </div>
                <div style={styles.courseDetails}>
                  <span style={styles.courseDetail}>📅 {new Date(course.date).toLocaleDateString('fr-FR')}</span>
                  <span style={styles.courseDetail}>🕐 {course.time}</span>
                  <span style={styles.courseDetail}>⏱️ {course.duration}</span>
                </div>
                <div style={styles.validationSection}>
                  <p style={styles.validationTitle}>📋 Statut de validation :</p>
                  <div style={styles.validationStatus}>
                    <div style={styles.validationItem}><span style={course.validated.parent ? styles.validated : styles.notValidated}>{course.validated.parent ? '✓' : '○'}</span><span style={styles.validationLabel}>Parent {course.validated.parent ? 'a validé' : "n'a pas encore validé"}</span></div>
                    <div style={styles.validationItem}><span style={course.validated.teacher ? styles.validated : styles.notValidated}>{course.validated.teacher ? '✓' : '○'}</span><span style={styles.validationLabel}>Vous {course.validated.teacher ? 'avez validé' : "n'avez pas encore validé"}</span></div>
                  </div>
                  {course.validated.parent && course.validated.teacher && <div style={styles.successMessage}>🎉 Cours entièrement validé — sera facturé !</div>}
                </div>
                {course.teacherRemarks && (
                  <div style={styles.remarksDisplay}>
                    <p style={styles.remarksTitle}>📝 Vos remarques :</p>
                    <div style={styles.remarkItem}><strong>Comportement :</strong> {course.teacherRemarks.studentBehavior}</div>
                    <div style={styles.remarkItem}><strong>Progression :</strong> {course.teacherRemarks.progress}</div>
                    <div style={styles.remarkItem}><strong>Suggestions :</strong> {course.teacherRemarks.suggestions}</div>
                    <div style={styles.remarkItem}><strong>Note :</strong> {'⭐'.repeat(course.teacherRemarks.rating)}</div>
                  </div>
                )}
                <div style={styles.actionButtons}>
                  <button onClick={() => handleOpenRemarkModal(course)} style={styles.remarkButton}>{course.teacherRemarks ? '✏️ Modifier les remarques' : '📝 Ajouter des remarques'}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── MESSAGES ── */}
        {activeTab === 'messages' && (
          <div style={styles.contentSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={styles.sectionTitle}>💬 Messages des élèves & parents</h3>
              <button onClick={fetchMessages} style={styles.manageButton}>🔄 Actualiser</button>
            </div>
            {messagesLoading && <div style={styles.loadingContainer}><div style={styles.spinner} /><p style={styles.loadingText}>Chargement...</p></div>}
            {!messagesLoading && messages.length === 0 && <div style={styles.emptyState}><span style={styles.emptyIcon}>💬</span><p>Aucun message pour l'instant.</p></div>}
            {messages.map((msg) => (
              <div key={msg.id} style={{ ...styles.messageCard, ...(!msg.is_read && msg.sender_type === 'parent' ? styles.messageCardUnread : {}) }}>
                <div style={styles.messageHeader}>
                  <div style={styles.messageAuthor}>
                    <span style={styles.messageAvatar}>{msg.sender_type === 'teacher' ? '👨‍🏫' : '👤'}</span>
                    <div>
                      <p style={styles.messageSender}>{msg.sender_name}</p>
                      <p style={styles.messageTime}>{new Date(msg.created_at).toLocaleDateString('fr-FR')} à {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  {!msg.is_read && msg.sender_type === 'parent' && <span style={styles.unreadDot} />}
                </div>
                <p style={styles.messageText}>{msg.content}</p>
                {msg.replies && msg.replies.length > 0 && (
                  <div style={styles.repliesContainer}>
                    {msg.replies.map(reply => (
                      <div key={reply.id} style={styles.replyCard}>
                        <div style={styles.messageAuthor}>
                          <span style={styles.messageAvatar}>{reply.sender_type === 'teacher' ? '👨‍🏫' : '👤'}</span>
                          <div>
                            <p style={{ ...styles.messageSender, fontSize: '13px' }}>{reply.sender_name}</p>
                            <p style={styles.messageTime}>{new Date(reply.created_at).toLocaleDateString('fr-FR')} à {new Date(reply.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <p style={{ ...styles.messageText, fontSize: '13px' }}>{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
                {replyingTo === msg.id ? (
                  <div style={{ marginTop: '12px' }}>
                    <textarea
                      autoFocus
                      placeholder="Votre réponse..."
                      value={replyContents[msg.id] || ''}
                      onChange={e => setReplyContents(prev => ({ ...prev, [msg.id]: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendReply(msg.id);
                        if (e.key === 'Escape') setReplyingTo(null);
                      }}
                      style={{ width: '100%', minHeight: '70px', padding: '12px', background: isDark ? 'rgba(255,255,255,0.08)' : '#f9fafb', border: isDark ? '1px solid rgba(253,216,53,0.3)' : '1px solid #e5e7eb', borderRadius: '10px', color: isDark ? '#fff' : '#111827', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '4px' }}
                      rows={2}
                    />
                    <p style={{ fontSize: '11px', color: isDark ? '#64748b' : '#9ca3af', margin: '0 0 8px', textAlign: 'right' }}>Ctrl+Entrée pour envoyer • Échap pour annuler</p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => { setReplyingTo(null); setReplyContents(prev => ({ ...prev, [msg.id]: '' })); }} style={styles.cancelModalBtn}>Annuler</button>
                      <button onClick={() => handleSendReply(msg.id)} disabled={sendingReply[msg.id] || !(replyContents[msg.id] || '').trim()} style={{ ...styles.confirmBtn, opacity: (sendingReply[msg.id] || !(replyContents[msg.id] || '').trim()) ? 0.5 : 1 }}>
                        {sendingReply[msg.id] ? '⏳ Envoi...' : '📤 Répondre'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setReplyingTo(msg.id)} style={styles.replyButton}>↩️ Répondre</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── REVENUS ── */}
        {activeTab === 'earnings' && (
          <div style={styles.contentSection}>
            <h3 style={styles.sectionTitle}>💰 Mes revenus</h3>
            <div style={styles.earningsSummary}>
              <div style={styles.summaryCard}><span style={styles.summaryLabel}>Total gagné</span><span style={styles.summaryValue}>{totalEarnings.toFixed(2)}€</span></div>
              <div style={styles.summaryCard}><span style={styles.summaryLabel}>Heures enseignées</span><span style={styles.summaryValue}>{totalHours.toFixed(1)}h</span></div>
              <div style={styles.summaryCard}><span style={styles.summaryLabel}>Taux moyen</span><span style={styles.summaryValue}>{avgRate}€/h</span></div>
              <div style={styles.summaryCard}><span style={styles.summaryLabel}>Cours terminés</span><span style={styles.summaryValue}>{completedCourses.length}</span></div>
            </div>
            {earnings.length === 0 && <div style={styles.emptyState}><span style={styles.emptyIcon}>💰</span><p>Aucun cours terminé pour l'instant.<br />Vos revenus apparaîtront ici automatiquement.</p></div>}
            {earnings.length > 0 && (
              <>
                <h4 style={{ color: isDark ? '#94a3b8' : '#6b7280', fontSize: '1rem', margin: '0 0 1rem' }}>Détail par mois</h4>
                <div style={styles.earningsList}>
                  {earnings.map((e, i) => (
                    <div key={i} style={styles.earningCard}>
                      <div style={styles.earningHeader}>
                        <h4 style={styles.earningMonth}>📅 {e.month}</h4>
                        <span style={styles.earningAmount}>{e.amount.toFixed(2)}€</span>
                      </div>
                      <div style={styles.earningDetails}><span>⏱️ {e.hours.toFixed(1)} heures</span><span>{e.hours > 0 ? (e.amount / e.hours).toFixed(2) : '0.00'}€/h</span></div>
                      <div style={styles.progressBarTrack}><div style={{ ...styles.progressBarFill, width: `${(e.hours / maxHours) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {completedCourses.length > 0 && (
              <>
                <h4 style={{ color: isDark ? '#94a3b8' : '#6b7280', fontSize: '1rem', margin: '2rem 0 1rem' }}>Détail des cours</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {completedCourses.map(course => (
                    <div key={course.id} style={{ ...styles.earningCard, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <p style={{ color: isDark ? '#FDD835' : '#111827', fontWeight: '600', margin: '0 0 3px', fontSize: '0.95rem' }}>{course.subject}</p>
                        <p style={{ color: isDark ? '#94a3b8' : '#6b7280', margin: 0, fontSize: '0.85rem' }}>👦 {course.student} • 📅 {new Date(course.date).toLocaleDateString('fr-FR')} • ⏱️ {course.duration}</p>
                      </div>
                      <span style={{ ...styles.amountBadge, flexShrink: 0 }}>💰 {course.amount.toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      {/* MODAL VISIO */}
      {showVideoConference && selectedCourse && (
        <div style={styles.videoModal}>
          <div style={styles.videoContainer}>
            <div style={styles.videoHeader}>
              <div style={styles.videoHeaderInfo}>
                <h3 style={styles.videoTitle}>{selectedCourse.subject} — {selectedCourse.studentName}</h3>
                <p style={styles.videoSubtitle}>Parent : {selectedCourse.parentName} | Durée : {selectedCourse.duration}h</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button onClick={() => openWhiteboardTab(selectedCourse)} style={styles.wbToggleBtn}>🖊️ Tableau blanc ↗</button>
                <button onClick={() => setShowVideoConference(false)} style={styles.videoCloseBtn}>✕</button>
              </div>
            </div>
            <div style={{ flex: 1, position: 'relative', background: '#0a0a0a', overflow: 'hidden' }}>
              <div ref={zegoContainerRef} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        </div>
      )}

      {/* MODAL REPORT */}
      {showRescheduleModal && selectedCourse && (
        <div style={styles.modalOverlay} onClick={() => setShowRescheduleModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3 style={styles.modalTitle}>📆 Reporter le cours</h3><button onClick={() => setShowRescheduleModal(false)} style={styles.modalClose}>✕</button></div>
            <div style={styles.modalBody}>
              <div style={styles.currentInfo}><p style={styles.currentLabel}>Date actuelle :</p><p style={styles.currentValue}>{selectedCourse.preferredDate && new Date(selectedCourse.preferredDate).toLocaleDateString('fr-FR')} à {selectedCourse.preferredTime?.slice(0, 5)}</p></div>
              <div style={styles.formGroup}><label style={styles.formLabel}>Nouvelle date</label><input type="date" value={rescheduleData.date} onChange={e => setRescheduleData({ ...rescheduleData, date: e.target.value })} style={styles.formInput} /></div>
              <div style={styles.formGroup}><label style={styles.formLabel}>Nouvelle heure</label><input type="time" value={rescheduleData.time} onChange={e => setRescheduleData({ ...rescheduleData, time: e.target.value })} style={styles.formInput} /></div>
              <div style={styles.formGroup}><label style={styles.formLabel}>Raison (optionnel)</label><textarea value={rescheduleData.reason} onChange={e => setRescheduleData({ ...rescheduleData, reason: e.target.value })} style={styles.formTextarea} /></div>
              <div style={styles.warningBox}><span>⚠️</span><p style={styles.warningText}>Le parent sera notifié et devra confirmer le nouveau créneau.</p></div>
            </div>
            <div style={styles.modalFooter}><button onClick={() => setShowRescheduleModal(false)} style={styles.cancelModalBtn}>Annuler</button><button onClick={confirmReschedule} style={styles.confirmBtn}>Confirmer le report</button></div>
          </div>
        </div>
      )}

      {/* MODAL ANNULATION */}
      {showCancelModal && selectedCourse && (
        <div style={styles.modalOverlay} onClick={() => setShowCancelModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3 style={styles.modalTitle}>❌ Annuler le cours</h3><button onClick={() => setShowCancelModal(false)} style={styles.modalClose}>✕</button></div>
            <div style={styles.modalBody}>
              <div style={styles.cancelInfo}><h4 style={styles.cancelCourseTitle}>{selectedCourse.subject}</h4><p style={styles.cancelCourseDetails}>{selectedCourse.studentName} — {selectedCourse.parentName}<br />{selectedCourse.preferredDate && new Date(selectedCourse.preferredDate).toLocaleDateString('fr-FR')} à {selectedCourse.preferredTime?.slice(0, 5)}</p></div>
              <div style={styles.dangerBox}><span style={{ fontSize: '24px' }}>⚠️</span><div><p style={styles.dangerTitle}>Attention !</p><p style={styles.dangerText}>Cette action est irréversible. Le parent sera immédiatement notifié.</p></div></div>
            </div>
            <div style={styles.modalFooter}><button onClick={() => setShowCancelModal(false)} style={styles.cancelModalBtn}>Retour</button><button onClick={confirmCancel} style={styles.dangerBtn}>Confirmer l'annulation</button></div>
          </div>
        </div>
      )}

      {/* MODAL REMARQUES */}
      {showRemarkModal && selectedCourse && (
        <div style={styles.modalOverlay} onClick={() => setShowRemarkModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3 style={styles.modalTitle}>📝 Remarques sur le cours</h3><button onClick={() => setShowRemarkModal(false)} style={styles.modalClose}>✕</button></div>
            <div style={styles.modalBody}>
              {[{ key: 'studentBehavior', label: "Comportement de l'élève", ph: "Comment s'est comporté l'élève ?" }, { key: 'progress', label: 'Progression', ph: "Quels progrès ?" }, { key: 'suggestions', label: 'Suggestions pour la suite', ph: 'Recommandations...' }].map(({ key, label, ph }) => (
                <div key={key} style={styles.formGroup}><label style={styles.formLabel}>{label}</label><textarea style={styles.formTextarea} value={remarkData[key]} onChange={e => setRemarkData({ ...remarkData, [key]: e.target.value })} placeholder={ph} rows={3} /></div>
              ))}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Évaluation (1-5 étoiles)</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {[1,2,3,4,5].map(star => <button key={star} onClick={() => setRemarkData({ ...remarkData, rating: star })} style={{ ...styles.starButton, color: star <= remarkData.rating ? '#FDD835' : (isDark ? '#475569' : '#d1d5db') }}>⭐</button>)}
                </div>
              </div>
            </div>
            <div style={styles.modalFooter}><button onClick={() => setShowRemarkModal(false)} style={styles.cancelModalBtn}>Annuler</button><button onClick={handleSaveRemarks} style={styles.confirmBtn}>💾 Enregistrer</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
