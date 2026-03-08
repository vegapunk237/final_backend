import { useState, useEffect, useRef } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

const API_URL = 'https://dollar5665.pythonanywhere.com/api';

// ─── THEME STYLES ────────────────────────────────────────────────────────────
const getStyles = (theme) => {
  const isDark = theme === 'dark';
  return {
    container:        { minHeight: '100vh', background: isDark ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : '#f8fafc', paddingBottom: '40px', position: 'relative', transition: 'background 0.3s ease' },
    bgDecor1:         { position: 'fixed', top: '-120px', right: '-120px', width: '420px', height: '420px', background: isDark ? 'radial-gradient(circle, rgba(253,216,53,0.12) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(253,216,53,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 },
    bgDecor2:         { position: 'fixed', bottom: '-160px', left: '-160px', width: '520px', height: '520px', background: isDark ? 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 },

    header:           { background: isDark ? 'rgba(15,23,42,0.95)' : '#ffffff', borderBottom: isDark ? '1px solid rgba(253,216,53,0.2)' : '1px solid #e5e7eb', boxShadow: isDark ? '0 1px 8px rgba(0,0,0,0.4)' : '0 1px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 100, backdropFilter: isDark ? 'blur(10px)' : 'none', transition: 'all 0.3s ease' },
    headerContent:    { maxWidth: '1400px', margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' },
    logoSection:      { display: 'flex', alignItems: 'center', gap: '14px' },
    logoCircle:       { width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #FDD835, #9333EA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: '#fff', boxShadow: '0 4px 14px rgba(253,216,53,0.4)' },
    brandName:        { fontSize: '18px', fontWeight: '800', color: isDark ? '#FDD835' : '#111827', margin: 0 },
    brandTagline:     { fontSize: '12px', color: isDark ? '#94a3b8' : '#6b7280', margin: 0 },
    headerActions:    { display: 'flex', gap: '10px', alignItems: 'center' },
    themeToggle:      { padding: '9px 14px', background: isDark ? 'rgba(253,216,53,0.1)' : '#f3f4f6', border: isDark ? '1px solid rgba(253,216,53,0.3)' : '1px solid #e5e7eb', borderRadius: '10px', color: isDark ? '#FDD835' : '#374151', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', transition: 'all 0.2s' },
    homeButton:       { padding: '9px 18px', background: isDark ? 'rgba(255,255,255,0.07)' : '#f3f4f6', border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #e5e7eb', borderRadius: '10px', color: isDark ? '#e2e8f0' : '#374151', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    logoutButton:     { padding: '9px 18px', background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid #fecaca', borderRadius: '10px', color: '#dc2626', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },

    welcomeBanner:    { maxWidth: '1400px', margin: '24px auto', padding: '0 24px' },
    welcomeContent:   { background: isDark ? 'linear-gradient(135deg, rgba(253,216,53,0.1), rgba(147,51,234,0.15))' : 'linear-gradient(135deg, #1e1b4b 0%, #6d28d9 100%)', border: isDark ? '1px solid rgba(253,216,53,0.2)' : 'none', borderRadius: '20px', padding: '36px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.4)' : '0 10px 40px rgba(109,40,217,0.25)' },
    welcomeTitle:     { fontSize: '28px', fontWeight: 'bold', color: '#FDD835', margin: '0 0 8px 0' },
    welcomeSubtitle:  { fontSize: '15px', color: isDark ? '#cbd5e1' : 'white', margin: 0, fontWeight: '500' },
    primaryCta:       { padding: '13px 28px', background: 'linear-gradient(135deg, #FDD835, #FFC107)', border: 'none', borderRadius: '12px', color: '#1a1a2e', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 6px 20px rgba(253,216,53,0.4)', whiteSpace: 'nowrap' },

    statsSection:     { maxWidth: '1400px', margin: '0 auto 28px', padding: '0 24px' },
    statsGrid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
    statCard:         { background: isDark ? 'rgba(15,23,42,0.85)' : '#ffffff', borderRadius: '16px', padding: '20px', border: isDark ? '1px solid rgba(148,163,184,0.1)' : '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.3s ease' },
    statIcon:         { fontSize: '32px', width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    statLabel:        { fontSize: '13px', color: isDark ? '#94a3b8' : '#6b7280', margin: '0 0 4px 0' },
    statValue:        { fontSize: '28px', fontWeight: 'bold', margin: 0 },

    tabsContainer:    { maxWidth: '1400px', margin: '0 auto 28px', padding: '0 24px' },
    tabs:             { background: isDark ? 'rgba(15,23,42,0.8)' : '#ffffff', borderRadius: '14px', padding: '6px', display: 'flex', gap: '6px', border: isDark ? '1px solid rgba(148,163,184,0.15)' : '1px solid #e5e7eb', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.04)' },
    tab:              { flex: 1, padding: '14px 20px', background: 'transparent', border: 'none', borderRadius: '10px', color: isDark ? '#94a3b8' : '#6b7280', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', position: 'relative', transition: 'all 0.2s' },
    tabActive:        { background: 'linear-gradient(135deg, #FDD835, #FFC107)', color: '#1a1a2e', boxShadow: '0 4px 12px rgba(253,216,53,0.3)' },
    tabBadge:         { background: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6', color: isDark ? '#cbd5e1' : '#374151', padding: '3px 9px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb' },
    tabNotification:  { background: '#ef4444', color: '#fff', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', position: 'absolute', top: '6px', right: '6px' },

    mainContent:      { maxWidth: '1400px', margin: '0 auto', padding: '0 24px' },
    sectionTitle:     { fontSize: '22px', fontWeight: '700', color: isDark ? '#FDD835' : '#111827', marginBottom: '20px' },

    coursesList:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' },
    courseCard:       { background: isDark ? 'rgba(15,23,42,0.85)' : '#ffffff', borderRadius: '18px', padding: '24px', border: isDark ? '1px solid rgba(148,163,184,0.12)' : '1px solid #e5e7eb', boxShadow: isDark ? '0 8px 30px rgba(0,0,0,0.35)' : '0 4px 16px rgba(0,0,0,0.06)', transition: 'all 0.3s ease' },
    courseCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' },
    teacherInfo:      { display: 'flex', alignItems: 'center', gap: '14px' },
    teacherAvatar:    { width: '54px', height: '54px', borderRadius: '14px', background: isDark ? 'linear-gradient(135deg, rgba(253,216,53,0.15), rgba(147,51,234,0.15))' : 'linear-gradient(135deg, #fef3c7, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', border: isDark ? '2px solid rgba(253,216,53,0.3)' : '2px solid #fde68a', flexShrink: 0 },
    courseSubject:    { fontSize: '18px', fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#111827', margin: '0 0 4px 0' },
    courseTeacher:    { fontSize: '13px', color: isDark ? '#94a3b8' : '#6b7280', margin: 0 },
    liveBadge:        { padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7', color: '#16a34a', border: isDark ? '1px solid rgba(34,197,94,0.3)' : '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' },
    livePulse:        { width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e' },
    waitingBadge:     { padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: isDark ? 'rgba(100,116,139,0.15)' : '#f1f5f9', color: isDark ? '#64748b' : '#94a3b8', border: isDark ? '1px solid rgba(100,116,139,0.25)' : '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' },
    waitingPulse:     { width: '7px', height: '7px', borderRadius: '50%', background: isDark ? '#475569' : '#cbd5e1' },
    completedBadge:   { padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7', color: '#16a34a', border: isDark ? '1px solid rgba(34,197,94,0.3)' : '1px solid #bbf7d0', whiteSpace: 'nowrap' },
    courseDetails:    { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px', padding: '14px', background: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb', borderRadius: '12px', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f3f4f6' },
    detailItem:       { display: 'flex', alignItems: 'center', gap: '10px' },
    detailText:       { fontSize: '14px', color: isDark ? '#cbd5e1' : '#374151' },
    courseActions:    { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '10px' },
    videoButton:      { padding: '12px 18px', borderRadius: '12px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    videoButtonActive:{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', boxShadow: '0 6px 20px rgba(34,197,94,0.3)' },
    videoButtonDisabled:{ background: isDark ? 'rgba(100,116,139,0.2)' : '#f1f5f9', color: isDark ? '#475569' : '#94a3b8', cursor: 'not-allowed', border: isDark ? '1px solid rgba(100,116,139,0.3)' : '1px solid #e2e8f0' },
    chatButton:       { padding: '12px 16px', background: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', border: isDark ? '1px solid rgba(59,130,246,0.3)' : '1px solid #bfdbfe', borderRadius: '12px', color: '#2563eb', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
    evaluationButton: { width: '100%', padding: '12px 18px', background: isDark ? 'rgba(139,92,246,0.1)' : '#f5f3ff', border: isDark ? '1px solid rgba(139,92,246,0.3)' : '1px solid #ddd6fe', borderRadius: '12px', color: '#7c3aed', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    courseManagement: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #f3f4f6' },
    manageButton:     { padding: '9px 10px', background: isDark ? 'rgba(253,216,53,0.08)' : '#fffbeb', border: isDark ? '1px solid rgba(253,216,53,0.25)' : '1px solid #fde68a', borderRadius: '10px', color: isDark ? '#FDD835' : '#92400e', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
    cancelButton:     { padding: '9px 10px', background: isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2', border: isDark ? '1px solid rgba(239,68,68,0.25)' : '1px solid #fecaca', borderRadius: '10px', color: isDark ? '#fca5a5' : '#dc2626', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },

    messagesList:     { display: 'flex', flexDirection: 'column', gap: '16px' },
    messageCard:      { background: isDark ? 'rgba(15,23,42,0.85)' : '#ffffff', borderRadius: '14px', padding: '20px', border: isDark ? '1px solid rgba(148,163,184,0.1)' : '1px solid #e5e7eb', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.04)' },
    messageCardUnread:{ borderColor: isDark ? 'rgba(253,216,53,0.35)' : '#fde68a', background: isDark ? 'rgba(253,216,53,0.05)' : '#fffef0', boxShadow: '0 2px 8px rgba(253,216,53,0.12)' },
    messageHeader:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    messageAuthor:    { display: 'flex', alignItems: 'center', gap: '12px' },
    messageAvatar:    { fontSize: '26px' },
    messageSender:    { fontSize: '15px', fontWeight: '600', color: isDark ? '#FDD835' : '#111827', margin: '0 0 2px 0' },
    messageTime:      { fontSize: '12px', color: isDark ? '#64748b' : '#9ca3af', margin: 0 },
    unreadDot:        { width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', flexShrink: 0 },
    messageText:      { fontSize: '14px', color: isDark ? '#cbd5e1' : '#374151', lineHeight: '1.6', marginBottom: '12px' },
    replyButton:      { padding: '7px 16px', background: isDark ? 'rgba(253,216,53,0.08)' : '#fffbeb', border: isDark ? '1px solid rgba(253,216,53,0.25)' : '1px solid #fde68a', borderRadius: '8px', color: isDark ? '#FDD835' : '#92400e', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    repliesContainer: { marginTop: '12px', paddingTop: '12px', borderTop: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' },
    replyCard:        { background: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb', borderRadius: '10px', padding: '12px 14px', borderLeft: isDark ? '3px solid rgba(253,216,53,0.3)' : '3px solid #fde68a' },
    newMessageButton: { padding: '11px 22px', background: 'linear-gradient(135deg, #FDD835, #FFC107)', border: 'none', borderRadius: '12px', color: '#1a1a2e', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' },
    composeBox:       { background: isDark ? 'rgba(15,23,42,0.85)' : '#ffffff', border: isDark ? '1px solid rgba(253,216,53,0.2)' : '1px solid #e5e7eb', borderRadius: '14px', padding: '20px', marginBottom: '20px', boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.05)' },
    composeTitle:     { fontSize: '15px', fontWeight: '600', color: isDark ? '#FDD835' : '#111827', marginBottom: '12px' },
    composeTextarea:  { width: '100%', minHeight: '90px', padding: '12px 16px', background: isDark ? 'rgba(255,255,255,0.06)' : '#f9fafb', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb', borderRadius: '10px', color: isDark ? '#f1f5f9' : '#111827', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '12px' },

    filesSection:     { marginTop: '14px', borderTop: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #f3f4f6', paddingTop: '14px' },
    filesToggleBtn:   { width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: isDark ? 'rgba(253,216,53,0.07)' : '#fffbeb', border: isDark ? '1px solid rgba(253,216,53,0.2)' : '1px solid #fde68a', borderRadius: '10px', color: isDark ? '#FDD835' : '#92400e', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    filesCount:       { background: isDark ? 'rgba(253,216,53,0.15)' : '#fef3c7', color: isDark ? '#FDD835' : '#92400e', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' },
    filesPanel:       { marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' },
    uploadZone:       { border: isDark ? '2px dashed rgba(253,216,53,0.25)' : '2px dashed #e5e7eb', borderRadius: '12px', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: isDark ? 'rgba(253,216,53,0.04)' : '#f9fafb', transition: 'border-color 0.2s', cursor: 'default' },
    uploadZoneText:   { color: isDark ? '#94a3b8' : '#6b7280', fontSize: '13px', margin: 0 },
    uploadBtn:        { display: 'inline-block', padding: '8px 20px', background: isDark ? 'rgba(253,216,53,0.1)' : '#fffbeb', border: isDark ? '1px solid rgba(253,216,53,0.3)' : '1px solid #fde68a', borderRadius: '8px', color: isDark ? '#FDD835' : '#92400e', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
    uploadDescInput:  { width: '100%', padding: '8px 12px', background: isDark ? 'rgba(255,255,255,0.06)' : '#ffffff', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb', borderRadius: '8px', color: isDark ? '#d1d5db' : '#374151', fontSize: '12px', outline: 'none', boxSizing: 'border-box', marginTop: '4px' },
    uploadHint:       { fontSize: '11px', color: isDark ? '#64748b' : '#9ca3af', margin: 0 },
    fileItem:         { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb', borderRadius: '10px', border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e5e7eb' },
    fileName:         { fontSize: '13px', fontWeight: '600', margin: '0 0 3px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    fileMeta:         { fontSize: '11px', color: isDark ? '#64748b' : '#9ca3af', margin: 0 },
    fileDesc:         { fontSize: '11px', color: isDark ? '#94a3b8' : '#6b7280', margin: '3px 0 0 0', fontStyle: 'italic' },
    fileActions:      { display: 'flex', gap: '6px', flexShrink: 0 },
    downloadBtn:      { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7', border: isDark ? '1px solid rgba(34,197,94,0.3)' : '1px solid #bbf7d0', borderRadius: '8px', fontSize: '14px', textDecoration: 'none', cursor: 'pointer' },
    deleteFileBtn:    { width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: isDark ? '1px solid rgba(239,68,68,0.25)' : '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' },

    videoModal:       { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' },
    videoContainer:   { background: '#1a1a2e', borderRadius: '20px', width: '100%', maxWidth: '1400px', height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(253,216,53,0.3)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' },
    videoHeader:      { padding: '16px 24px', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(253,216,53,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
    videoTitle:       { fontSize: '18px', fontWeight: 'bold', color: '#FDD835', margin: '0 0 4px 0' },
    videoSubtitle:    { fontSize: '13px', color: '#9ca3af', margin: 0 },
    videoCloseBtn:    { width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    wbToggleBtn:      { padding: '8px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#d1d5db', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },

    modalOverlay:     { position: 'fixed', inset: 0, background: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
    modalContent:     { background: isDark ? 'rgba(15,23,42,0.98)' : '#ffffff', backdropFilter: isDark ? 'blur(20px)' : 'none', borderRadius: '20px', maxWidth: '580px', width: '100%', maxHeight: '90vh', overflow: 'auto', border: isDark ? '1px solid rgba(253,216,53,0.25)' : '1px solid #e5e7eb', boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.6)' : '0 20px 60px rgba(0,0,0,0.15)' },
    modalHeader:      { padding: '22px 28px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDark ? 'rgba(253,216,53,0.07)' : '#f9fafb', borderRadius: '20px 20px 0 0' },
    modalTitle:       { fontSize: '20px', fontWeight: '700', color: isDark ? '#FDD835' : '#111827', margin: 0 },
    modalClose:       { width: '36px', height: '36px', borderRadius: '50%', background: isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2', border: isDark ? '1px solid rgba(239,68,68,0.3)' : '1px solid #fecaca', color: '#dc2626', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modalBody:        { padding: '28px' },
    modalFooter:      { padding: '18px 28px', borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: '10px' },
    formGroup:        { marginBottom: '18px' },
    formLabel:        { display: 'block', fontSize: '14px', fontWeight: '600', color: isDark ? '#FDD835' : '#374151', marginBottom: '7px' },
    formInput:        { width: '100%', padding: '11px 14px', background: isDark ? 'rgba(255,255,255,0.07)' : '#f9fafb', border: isDark ? '1px solid rgba(253,216,53,0.25)' : '1px solid #e5e7eb', borderRadius: '10px', color: isDark ? '#f1f5f9' : '#111827', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    formTextarea:     { width: '100%', minHeight: '100px', padding: '11px 14px', background: isDark ? 'rgba(255,255,255,0.07)' : '#f9fafb', border: isDark ? '1px solid rgba(253,216,53,0.25)' : '1px solid #e5e7eb', borderRadius: '10px', color: isDark ? '#f1f5f9' : '#111827', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' },
    cancelModalBtn:   { padding: '11px 22px', background: isDark ? 'rgba(255,255,255,0.07)' : '#f3f4f6', border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e5e7eb', borderRadius: '10px', color: isDark ? '#cbd5e1' : '#374151', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
    confirmBtn:       { padding: '11px 22px', background: 'linear-gradient(135deg, #FDD835, #FFC107)', border: 'none', borderRadius: '10px', color: '#1a1a2e', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
    dangerBtn:        { padding: '11px 22px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  };
};

const ParentDashboard = ({ navigate, user, onLogout }) => {
  const [theme, setTheme]                       = useState('light');
  const [activeTab, setActiveTab]               = useState('planned');
  const [selectedCourse, setSelectedCourse]     = useState(null);

  const [showEvaluation, setShowEvaluation]           = useState(false);
  const [showVideoConference, setShowVideoConference] = useState(false);
  const [showModifyModal, setShowModifyModal]         = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal]         = useState(false);

  const [plannedCourses, setPlannedCourses]     = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [loadingCourses, setLoadingCourses]     = useState(true);
  const [loadingCompleted, setLoadingCompleted] = useState(true);
  const [modifyData, setModifyData]             = useState({ subject: '', childName: '', notes: '' });
  const [rescheduleData, setRescheduleData]     = useState({ date: '', time: '', reason: '' });
  const zegoContainerRef = useRef(null);

  const [courseFiles, setCourseFiles]   = useState({});
  const [filesLoading, setFilesLoading] = useState({});
  const [uploadingFile, setUploadingFile] = useState({});
  const [uploadDesc, setUploadDesc]     = useState('');
  const [expandedFiles, setExpandedFiles] = useState({});
  const fileInputRef = useRef(null);

  const ALLOWED_TYPES = {
    'application/pdf': { icon: '📄', label: 'PDF', color: '#ef4444' },
    'image/jpeg':      { icon: '🖼️', label: 'Image', color: '#3b82f6' },
    'image/png':       { icon: '🖼️', label: 'Image', color: '#3b82f6' },
    'image/gif':       { icon: '🖼️', label: 'Image', color: '#3b82f6' },
    'image/webp':      { icon: '🖼️', label: 'Image', color: '#3b82f6' },
    'application/msword': { icon: '📝', label: 'Word', color: '#2563eb' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📝', label: 'Word', color: '#2563eb' },
    'application/vnd.ms-excel': { icon: '📊', label: 'Excel', color: '#16a34a' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: '📊', label: 'Excel', color: '#16a34a' },
  };

  const [messages, setMessages]             = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyingTo, setReplyingTo]         = useState(null);
  const [replyContent, setReplyContent]     = useState('');
  const [newMsgContent, setNewMsgContent]   = useState('');
  const [showCompose, setShowCompose]       = useState(false);
  const [sendingMsg, setSendingMsg]         = useState(false);

  // Compute styles based on current theme
  const styles = getStyles(theme);
  const isDark = theme === 'dark';

  const fetchMessages = async () => {
    if (!user?.id) return;
    setMessagesLoading(true);
    try {
      const res  = await fetch(`${API_URL}/messages/?user_type=parent&user_id=${user.id}`);
      const data = await res.json();
      if (data.success) setMessages(data.data);
    } catch(e) { console.error('Erreur messages:', e); }
    finally { setMessagesLoading(false); }
  };

  const sendMessage = async (content, parentMessageId = null) => {
    if (!content.trim()) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`${API_URL}/messages/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderType:      'parent',
          senderId:        user.id,
          senderName:      user.name || 'Parent',
          content:         content.trim(),
          parentMessageId: parentMessageId || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchMessages();
        setNewMsgContent('');
        setReplyContent('');
        setShowCompose(false);
        setReplyingTo(null);
      } else { alert('❌ ' + data.message); }
    } catch(e) { alert('❌ Erreur de connexion'); }
    finally { setSendingMsg(false); }
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
    if (!ALLOWED_TYPES[file.type]) { alert('❌ Type de fichier non autorisé.\nFormats acceptés : PDF, images, Word, Excel'); return; }
    if (file.size > 20 * 1024 * 1024) { alert('❌ Fichier trop lourd (max 20 MB)'); return; }
    setUploadingFile(prev => ({ ...prev, [courseId]: true }));
    try {
      const formData = new FormData();
      formData.append('file',          file);
      formData.append('uploaded_by',   'parent');
      formData.append('uploader_name', user?.name || 'Parent');
      formData.append('description',   uploadDesc);
      const res  = await fetch(`${API_URL}/appointments/${courseId}/files/`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setCourseFiles(prev => ({ ...prev, [courseId]: [data.data, ...(prev[courseId] || [])] }));
        setUploadDesc('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else { alert('❌ Erreur : ' + data.message); }
    } catch(e) { alert('❌ Erreur de connexion'); }
    finally { setUploadingFile(prev => ({ ...prev, [courseId]: false })); }
  };

  const handleDeleteFile = async (courseId, fileId) => {
    if (!window.confirm('Supprimer ce fichier ?')) return;
    try {
      const res  = await fetch(`${API_URL}/files/${fileId}/`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) setCourseFiles(prev => ({ ...prev, [courseId]: prev[courseId].filter(f => f.id !== fileId) }));
      else alert('❌ Erreur : ' + data.message);
    } catch(e) { alert('❌ Erreur de connexion'); }
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
    const userID       = `parent_${user?.id || Date.now()}`;
    const userName     = user?.name || 'Parent';
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
    if (!user?.id) return;
    const fetchPlannedCourses = async () => {
      setLoadingCourses(true);
      try {
        const response = await fetch(`${API_URL}/appointments/`);
        const data     = await response.json();
        if (data.success) {
          const mine = (data.data || []).filter(a =>
            String(a.parentId) === String(user.id) &&
            (a.status === 'assigned' || a.status === 'confirmed') &&
            a.assignedTeacher
          );
          setPlannedCourses(mine.map(a => ({
            id:            a.id,
            subject:       a.subject,
            level:         a.level,
            teacher:       a.assignedTeacher,
            teacherAvatar: '👨‍🏫',
            date:          a.preferredDate,
            time:          a.preferredTime?.slice(0, 5) || '00:00',
            duration:      `${a.duration}h`,
            childName:     a.studentName,
            location:      a.location,
            status:        a.status,
          })));
        }
      } catch (err) { console.error('❌ Erreur:', err); }
      finally { setLoadingCourses(false); }
    };
    fetchPlannedCourses();
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchCompleted = async () => {
      setLoadingCompleted(true);
      try {
        const res  = await fetch(`${API_URL}/appointments/`);
        const data = await res.json();
        if (data.success) {
          const done = (data.data || []).filter(a =>
            String(a.parentId) === String(user.id) && a.status === 'completed'
          );
          setCompletedCourses(done.map(a => ({
            id:            a.id,
            subject:       a.subject,
            teacher:       a.assignedTeacher || 'Enseignant',
            teacherAvatar: '👨‍🏫',
            date:          a.preferredDate,
            time:          a.preferredTime?.slice(0, 5) || '00:00',
            duration:      `${a.duration}h`,
            childName:     a.studentName,
            evaluation:    null,
          })));
        }
      } catch (err) { console.error('❌ Erreur cours terminés:', err); }
      finally { setLoadingCompleted(false); }
    };
    fetchCompleted();
  }, [user]);

  useEffect(() => { if (user?.id) fetchMessages(); }, [user]);

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
  const isVideoAvailable = (date, time, duration = '1h') => {
    if (!date || !time) return false;
    const [h, m]   = time.split(':').map(Number);
    const start    = new Date(date);
    start.setHours(h, m, 0, 0);
    const durationH = parseFloat(String(duration).replace('h', '')) || 1;
    const end      = new Date(start.getTime() + (durationH + 0.5) * 3600_000); // +30 min marge
    const earliest = new Date(start.getTime() - 3600_000); // -1h avant
    return now >= earliest && now <= end;
  };

  const handleJoinVideo        = (course) => { setSelectedCourse(course); setShowVideoConference(true); };
  const handleModifyCourse     = (course) => { setSelectedCourse(course); setModifyData({ subject: course.subject, childName: course.childName, notes: '' }); setShowModifyModal(true); };
  const handleRescheduleCourse = (course) => { setSelectedCourse(course); setRescheduleData({ date: course.date, time: course.time, reason: '' }); setShowRescheduleModal(true); };
  const handleCancelCourse     = (course) => { setSelectedCourse(course); setShowCancelModal(true); };
  const confirmModify          = () => setShowModifyModal(false);
  const confirmReschedule      = () => setShowRescheduleModal(false);
  const confirmCancel          = () => { setPlannedCourses(prev => prev.filter(c => c.id !== selectedCourse.id)); setShowCancelModal(false); };

  const openWhiteboardTab = (course) => {
    const name = encodeURIComponent(`${course.subject} — ${course.teacher || ''}`);
    window.open(`/whiteboard.html?course=${name}`, '_blank', 'width=1200,height=750,toolbar=0,menubar=0');
  };

  const unreadCount = messages.filter(m => !m.is_read && m.sender_type === 'teacher').length;

  return (
    <div style={styles.container}>
      <div style={styles.bgDecor1} /><div style={styles.bgDecor2} />

      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoSection}>
            <div style={styles.logoCircle}>KH</div>
            <div>
              <h1 style={styles.brandName}>KH PERFECTION</h1>
              <p style={styles.brandTagline}>Espace Parent</p>
            </div>
          </div>
          <div style={styles.headerActions}>
            {/* THEME TOGGLE */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              style={styles.themeToggle}
              title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              <span style={{ fontSize: '18px' }}>{isDark ? '☀️' : '🌙'}</span>
              <span style={{ fontSize: '13px' }}>{isDark ? 'Clair' : 'Sombre'}</span>
            </button>
            <button onClick={() => navigate('home')} style={styles.homeButton}>🏠 Accueil</button>
            <button onClick={onLogout}               style={styles.logoutButton}>🚪 Déconnexion</button>
          </div>
        </div>
      </header>

      {/* BANNIÈRE */}
      <section style={styles.welcomeBanner}>
        <div style={styles.welcomeContent}>
          <div>
            <h2 style={styles.welcomeTitle}>Bienvenue, {user?.full_name || 'Lucie'} ! 👋</h2>
            <p style={styles.welcomeSubtitle}>Saviez-vous qu'avec seulement 2 heures de cours par semaine pendant 6 mois, un élève peut augmenter sa moyenne de 4 points ? La régularité est la clé de la réussite.</p>
          </div>
          <button onClick={() => navigate('appointment')} style={styles.primaryCta}>➕ Réserver un cours</button>
        </div>
      </section>

      {/* STATS */}
      <section style={styles.statsSection}>
        <div style={styles.statsGrid}>
          {[
            { icon: '📅', label: 'Cours planifiés',  value: plannedCourses.length,   color: '#3b82f6' },
            { icon: '✅', label: 'Cours terminés',   value: completedCourses.length, color: '#22c55e' },
            { icon: '💬', label: 'Messages non lus', value: unreadCount,             color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} style={{ ...styles.statCard, borderTop: `4px solid ${s.color}` }}>
              <div style={{ ...styles.statIcon, background: `${s.color}18` }}>{s.icon}</div>
              <div>
                <p style={styles.statLabel}>{s.label}</p>
                <p style={{ ...styles.statValue, color: s.color }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ONGLETS */}
      <section style={styles.tabsContainer}>
        <div style={styles.tabs}>
          {[
            { key: 'planned',   icon: '📅', label: 'Cours planifiés', badge: plannedCourses.length },
            { key: 'completed', icon: '✅', label: 'Cours terminés',  badge: completedCourses.length },
            { key: 'chat',      icon: '💬', label: 'Messages',        notif: unreadCount },
          ].map(({ key, icon, label, badge, notif }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              style={{ ...styles.tab, ...(activeTab === key ? styles.tabActive : {}) }}>
              <span>{icon}</span><span>{label}</span>
              {badge !== undefined && badge > 0 && <span style={styles.tabBadge}>{badge}</span>}
              {notif > 0 && <span style={styles.tabNotification}>{notif}</span>}
            </button>
          ))}
        </div>
      </section>

      {/* CONTENU */}
      <section style={styles.mainContent}>

        {/* ── COURS PLANIFIÉS ── */}
        {activeTab === 'planned' && (
          <div>
            <h3 style={styles.sectionTitle}>📅 Prochains cours</h3>
            {loadingCourses && <p style={{ color: isDark ? '#94a3b8' : '#6b7280', textAlign: 'center', padding: '2rem' }}>⏳ Chargement...</p>}
            {!loadingCourses && plannedCourses.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: isDark ? '#94a3b8' : '#6b7280' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📭</span>
                <p>Aucun cours planifié avec un enseignant assigné.</p>
                <button onClick={() => navigate('appointment')} style={{ ...styles.primaryCta, margin: '1rem auto' }}>➕ Réserver un cours</button>
              </div>
            )}
            <div style={styles.coursesList}>
              {plannedCourses.map((course) => (
                <div key={course.id} style={styles.courseCard}>
                  <div style={styles.courseCardHeader}>
                    <div style={styles.teacherInfo}>
                      <div style={styles.teacherAvatar}>{course.teacherAvatar}</div>
                      <div>
                        <h4 style={styles.courseSubject}>{course.subject}</h4>
                        <p style={styles.courseTeacher}>👨‍🏫 {course.teacher}</p>
                      </div>
                    </div>
                    <span style={isVideoAvailable(course.date, course.time, course.duration) ? styles.liveBadge : styles.waitingBadge}>
                      <span style={isVideoAvailable(course.date, course.time, course.duration) ? styles.livePulse : styles.waitingPulse} />
                      {isVideoAvailable(course.date, course.time, course.duration) ? 'En ligne' : 'En attente'}
                    </span>
                  </div>
                  <div style={styles.courseDetails}>
                    <div style={styles.detailItem}><span>👶</span><span style={styles.detailText}>{course.childName}</span></div>
                    <div style={styles.detailItem}><span>🎓</span><span style={styles.detailText}>{course.level}</span></div>
                    <div style={styles.detailItem}><span>📅</span><span style={styles.detailText}>{new Date(course.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span></div>
                    <div style={styles.detailItem}><span>🕐</span><span style={styles.detailText}>{course.time} — Durée : {course.duration}</span></div>
                    <div style={styles.detailItem}><span>📍</span><span style={styles.detailText}>{course.location === 'online' ? '💻 En ligne' : '🏠 À domicile'}</span></div>
                  </div>
                  <div style={styles.courseActions}>
                    {(() => {
                      const available = isVideoAvailable(course.date, course.time, course.duration);
                      return (
                        <button
                          onClick={() => available && handleJoinVideo(course)}
                          disabled={!available}
                          title={available ? 'Rejoindre la visio' : 'Disponible 1h avant le cours'}
                          style={{
                            ...styles.videoButton,
                            ...(available ? styles.videoButtonActive : styles.videoButtonDisabled),
                          }}
                        >
                          {available ? '📹 Rejoindre la visio' : '🔒 Visio indisponible'}
                        </button>
                      );
                    })()}
                    <button onClick={() => setActiveTab('chat')} style={styles.chatButton}>💬 Contacter</button>
                  </div>
                  <div style={styles.courseManagement}>
                    <button onClick={() => handleModifyCourse(course)}     style={styles.manageButton}>✏️ Modifier</button>
                    <button onClick={() => handleRescheduleCourse(course)} style={styles.manageButton}>📆 Reporter</button>
                    <button onClick={() => handleCancelCourse(course)}     style={styles.cancelButton}>❌ Annuler</button>
                  </div>

                  {/* FICHIERS */}
                  <div style={styles.filesSection}>
                    <button onClick={() => toggleFiles(course.id)} style={styles.filesToggleBtn}>
                      <span>📎 Documents du cours</span>
                      <span style={styles.filesCount}>{courseFiles[course.id] ? `${courseFiles[course.id].length} fichier${courseFiles[course.id].length !== 1 ? 's' : ''}` : 'Voir'}</span>
                      <span style={{ marginLeft: 'auto', transition: 'transform 0.2s', transform: expandedFiles[course.id] ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
                    </button>
                    {expandedFiles[course.id] && (
                      <div style={styles.filesPanel}>
                        <div style={styles.uploadZone}
                          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#FDD835'; }}
                          onDragLeave={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(253,216,53,0.25)' : '#e5e7eb'; }}
                          onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = isDark ? 'rgba(253,216,53,0.25)' : '#e5e7eb'; const f = e.dataTransfer.files[0]; if(f) handleFileUpload(course.id, f); }}
                        >
                          <span style={{ fontSize: '28px' }}>📤</span>
                          <p style={styles.uploadZoneText}>Glissez un fichier ici ou</p>
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx"
                            style={{ display: 'none' }} id={`file-input-${course.id}`}
                            onChange={e => handleFileUpload(course.id, e.target.files[0])}
                          />
                          <label htmlFor={`file-input-${course.id}`} style={styles.uploadBtn}>
                            {uploadingFile[course.id] ? '⏳ Envoi en cours...' : '📁 Choisir un fichier'}
                          </label>
                          <input type="text" placeholder="Description (optionnel)"
                            value={uploadDesc} onChange={e => setUploadDesc(e.target.value)}
                            style={styles.uploadDescInput}
                          />
                          <p style={styles.uploadHint}>PDF • Images • Word • Excel — max 20 Mo</p>
                        </div>
                        {filesLoading[course.id] && <p style={{ textAlign: 'center', color: isDark ? '#94a3b8' : '#6b7280', padding: '1rem' }}>⏳ Chargement...</p>}
                        {!filesLoading[course.id] && courseFiles[course.id]?.length === 0 && (
                          <p style={{ textAlign: 'center', color: isDark ? '#64748b' : '#9ca3af', padding: '1rem', fontSize: '13px' }}>Aucun document partagé pour ce cours.</p>
                        )}
                        {(courseFiles[course.id] || []).map(cf => {
                          const typeMap = { pdf: { icon: '📄', color: '#ef4444' }, image: { icon: '🖼️', color: '#3b82f6' }, word: { icon: '📝', color: '#2563eb' }, excel: { icon: '📊', color: '#16a34a' }, other: { icon: '📎', color: '#9ca3af' } };
                          const fi = typeMap[cf.file_type] || typeMap.other;
                          return (
                            <div key={cf.id} style={styles.fileItem}>
                              <span style={{ fontSize: '22px', flexShrink: 0 }}>{fi.icon}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ ...styles.fileName, color: fi.color }}>{cf.original_name}</p>
                                <p style={styles.fileMeta}>{formatFileSize(cf.file_size)} • {cf.uploader_name || cf.uploaded_by} • {new Date(cf.uploaded_at).toLocaleDateString('fr-FR')}</p>
                                {cf.description && <p style={styles.fileDesc}>{cf.description}</p>}
                              </div>
                              <div style={styles.fileActions}>
                                <a href={`${API_URL}/files/${cf.id}/download/`} download={cf.original_name} style={styles.downloadBtn} title="Télécharger">⬇️</a>
                                {cf.uploaded_by === 'parent' && (
                                  <button onClick={() => handleDeleteFile(course.id, cf.id)} style={styles.deleteFileBtn} title="Supprimer">🗑️</button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── COURS TERMINÉS ── */}
        {activeTab === 'completed' && (
          <div>
            <h3 style={styles.sectionTitle}>✅ Historique des cours</h3>
            {loadingCompleted && <p style={{ color: isDark ? '#94a3b8' : '#6b7280', textAlign: 'center', padding: '2rem' }}>⏳ Chargement...</p>}
            {!loadingCompleted && completedCourses.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: isDark ? '#94a3b8' : '#6b7280' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📭</span>
                <p>Aucun cours terminé pour l'instant.</p>
              </div>
            )}
            <div style={styles.coursesList}>
              {completedCourses.map((course) => (
                <div key={course.id} style={styles.courseCard}>
                  <div style={styles.courseCardHeader}>
                    <div style={styles.teacherInfo}>
                      <div style={styles.teacherAvatar}>{course.teacherAvatar}</div>
                      <div>
                        <h4 style={styles.courseSubject}>{course.subject}</h4>
                        <p style={styles.courseTeacher}>{course.teacher}</p>
                      </div>
                    </div>
                    <span style={styles.completedBadge}>✓ Terminé</span>
                  </div>
                  <div style={styles.courseDetails}>
                    <div style={styles.detailItem}><span>👶</span><span style={styles.detailText}>{course.childName}</span></div>
                    <div style={styles.detailItem}><span>📅</span><span style={styles.detailText}>{new Date(course.date).toLocaleDateString('fr-FR')}</span></div>
                    <div style={styles.detailItem}><span>🕐</span><span style={styles.detailText}>{course.time} — {course.duration}</span></div>
                  </div>
                  {course.evaluation && (
                    <button onClick={() => { setSelectedCourse(course); setShowEvaluation(true); }} style={styles.evaluationButton}>
                      📊 Voir l'appréciation du professeur
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MESSAGES ── */}
        {activeTab === 'chat' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={styles.sectionTitle}>💬 Messages</h3>
              <button onClick={() => setShowCompose(true)} style={styles.newMessageButton}>✉️ Nouveau message</button>
            </div>

            {showCompose && (
              <div style={styles.composeBox}>
                <p style={styles.composeTitle}>✉️ Envoyer un message aux enseignants</p>
                <textarea
                  placeholder="Votre message..."
                  value={newMsgContent}
                  onChange={e => setNewMsgContent(e.target.value)}
                  style={styles.composeTextarea}
                  rows={4}
                />
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button onClick={() => { setShowCompose(false); setNewMsgContent(''); }} style={styles.cancelModalBtn}>Annuler</button>
                  <button onClick={() => sendMessage(newMsgContent)} disabled={sendingMsg || !newMsgContent.trim()} style={styles.confirmBtn}>
                    {sendingMsg ? '⏳ Envoi...' : '📤 Envoyer'}
                  </button>
                </div>
              </div>
            )}

            {messagesLoading && <p style={{ color: isDark ? '#94a3b8' : '#6b7280', textAlign: 'center', padding: '2rem' }}>⏳ Chargement...</p>}

            {!messagesLoading && messages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: isDark ? '#94a3b8' : '#6b7280' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>💬</span>
                <p>Aucun message. Envoyez votre premier message !</p>
              </div>
            )}

            <div style={styles.messagesList}>
              {messages.map((msg) => (
                <div key={msg.id} style={{ ...styles.messageCard, ...(!msg.is_read && msg.sender_type === 'teacher' ? styles.messageCardUnread : {}) }}>
                  <div style={styles.messageHeader}>
                    <div style={styles.messageAuthor}>
                      <span style={styles.messageAvatar}>{msg.sender_type === 'teacher' ? '👨‍🏫' : '👤'}</span>
                      <div>
                        <p style={styles.messageSender}>{msg.sender_name}</p>
                        <p style={styles.messageTime}>{new Date(msg.created_at).toLocaleDateString('fr-FR')} à {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    {!msg.is_read && msg.sender_type === 'teacher' && <span style={styles.unreadDot} />}
                  </div>
                  <p style={styles.messageText}>{msg.content}</p>

                  {msg.replies && msg.replies.length > 0 && (
                    <div style={styles.repliesContainer}>
                      {msg.replies.map(reply => (
                        <div key={reply.id} style={styles.replyCard}>
                          <div style={styles.messageAuthor}>
                            <span style={{ fontSize: '20px' }}>{reply.sender_type === 'teacher' ? '👨‍🏫' : '👤'}</span>
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
                    <div style={{ marginTop: '10px' }}>
                      <textarea
                        placeholder="Votre réponse..."
                        value={replyContent}
                        onChange={e => setReplyContent(e.target.value)}
                        style={{ ...styles.composeTextarea, minHeight: '70px' }}
                        rows={2}
                      />
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                        <button onClick={() => { setReplyingTo(null); setReplyContent(''); }} style={styles.cancelModalBtn}>Annuler</button>
                        <button onClick={() => sendMessage(replyContent, msg.id)} disabled={sendingMsg || !replyContent.trim()} style={styles.confirmBtn}>
                          {sendingMsg ? '⏳...' : '📤 Répondre'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setReplyingTo(msg.id); setReplyContent(''); }} style={styles.replyButton}>
                      ↩️ Répondre
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* MODAL VISIO */}
      {showVideoConference && selectedCourse && (
        <div style={styles.videoModal}>
          <div style={styles.videoContainer}>
            <div style={styles.videoHeader}>
              <div style={{ flex: 1 }}>
                <h3 style={styles.videoTitle}>{selectedCourse.subject} — {selectedCourse.teacher}</h3>
                <p style={styles.videoSubtitle}>Élève : {selectedCourse.childName} | Durée : {selectedCourse.duration}</p>
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

      {/* MODAL MODIFICATION */}
      {showModifyModal && selectedCourse && (
        <div style={styles.modalOverlay} onClick={() => setShowModifyModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3 style={styles.modalTitle}>✏️ Modifier le cours</h3><button onClick={() => setShowModifyModal(false)} style={styles.modalClose}>✕</button></div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}><label style={styles.formLabel}>Matière</label><input type="text" value={modifyData.subject} onChange={e => setModifyData({ ...modifyData, subject: e.target.value })} style={styles.formInput} /></div>
              <div style={styles.formGroup}><label style={styles.formLabel}>Enfant concerné</label><input type="text" value={modifyData.childName} onChange={e => setModifyData({ ...modifyData, childName: e.target.value })} style={styles.formInput} /></div>
              <div style={styles.formGroup}><label style={styles.formLabel}>Notes</label><textarea value={modifyData.notes} onChange={e => setModifyData({ ...modifyData, notes: e.target.value })} style={styles.formTextarea} placeholder="Ex: Insister sur les fractions..." /></div>
            </div>
            <div style={styles.modalFooter}><button onClick={() => setShowModifyModal(false)} style={styles.cancelModalBtn}>Annuler</button><button onClick={confirmModify} style={styles.confirmBtn}>Enregistrer</button></div>
          </div>
        </div>
      )}

      {/* MODAL REPORT */}
      {showRescheduleModal && selectedCourse && (
        <div style={styles.modalOverlay} onClick={() => setShowRescheduleModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3 style={styles.modalTitle}>📆 Reporter le cours</h3><button onClick={() => setShowRescheduleModal(false)} style={styles.modalClose}>✕</button></div>
            <div style={styles.modalBody}>
              <div style={{ marginBottom: '20px', padding: '15px', background: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', borderRadius: '12px', border: isDark ? '1px solid rgba(59,130,246,0.25)' : '1px solid #bfdbfe' }}>
                <p style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '600', marginBottom: '6px' }}>Date actuelle :</p>
                <p style={{ fontSize: '16px', color: isDark ? '#e2e8f0' : '#1e3a5f', margin: 0 }}>{new Date(selectedCourse.date).toLocaleDateString('fr-FR')} à {selectedCourse.time}</p>
              </div>
              <div style={styles.formGroup}><label style={styles.formLabel}>Nouvelle date</label><input type="date" value={rescheduleData.date} onChange={e => setRescheduleData({ ...rescheduleData, date: e.target.value })} style={styles.formInput} /></div>
              <div style={styles.formGroup}><label style={styles.formLabel}>Nouvelle heure</label><input type="time" value={rescheduleData.time} onChange={e => setRescheduleData({ ...rescheduleData, time: e.target.value })} style={styles.formInput} /></div>
              <div style={styles.formGroup}><label style={styles.formLabel}>Raison (optionnel)</label><textarea value={rescheduleData.reason} onChange={e => setRescheduleData({ ...rescheduleData, reason: e.target.value })} style={styles.formTextarea} /></div>
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
              <div style={{ padding: '20px', background: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb', borderRadius: '12px', textAlign: 'center', marginBottom: '20px', border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #e5e7eb' }}>
                <h4 style={{ fontSize: '20px', fontWeight: 'bold', color: isDark ? '#f1f5f9' : '#111827', marginBottom: '10px' }}>{selectedCourse.subject}</h4>
                <p style={{ fontSize: '14px', color: isDark ? '#94a3b8' : '#6b7280', lineHeight: '1.6', margin: 0 }}>{selectedCourse.teacher} — {selectedCourse.childName}<br />{new Date(selectedCourse.date).toLocaleDateString('fr-FR')} à {selectedCourse.time}</p>
              </div>
              <div style={{ padding: '15px', background: isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2', borderRadius: '12px', border: isDark ? '1px solid rgba(239,68,68,0.25)' : '1px solid #fecaca', display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
                <div><p style={{ fontSize: '15px', fontWeight: 'bold', color: '#dc2626', marginBottom: '8px' }}>Attention !</p><p style={{ fontSize: '13px', color: isDark ? '#fca5a5' : '#b91c1c', margin: 0 }}>Cette action est irréversible. Le cours sera définitivement annulé.</p></div>
              </div>
            </div>
            <div style={styles.modalFooter}><button onClick={() => setShowCancelModal(false)} style={styles.cancelModalBtn}>Retour</button><button onClick={confirmCancel} style={styles.dangerBtn}>Confirmer l'annulation</button></div>
          </div>
        </div>
      )}

      {/* MODAL ÉVALUATION */}
      {showEvaluation && selectedCourse?.evaluation && (
        <div style={styles.modalOverlay} onClick={() => setShowEvaluation(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}><h3 style={styles.modalTitle}>📊 Évaluation du cours</h3><button onClick={() => setShowEvaluation(false)} style={styles.modalClose}>✕</button></div>
            <div style={{ padding: '30px' }}>
              <div style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb', padding: '20px', borderRadius: '16px', border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #e5e7eb', marginBottom: '25px' }}>
                <h4 style={{ fontSize: '20px', fontWeight: '700', color: isDark ? '#f1f5f9' : '#111827', margin: '0 0 8px 0' }}>{selectedCourse.subject}</h4>
                <p style={{ fontSize: '15px', color: '#8b5cf6', margin: '0 0 8px 0' }}>Par {selectedCourse.teacher}</p>
                <p style={{ fontSize: '13px', color: isDark ? '#94a3b8' : '#6b7280', margin: 0 }}>{new Date(selectedCourse.date).toLocaleDateString('fr-FR')} — {selectedCourse.childName}</p>
              </div>
              {selectedCourse.evaluation.criteria?.map((c, i) => (
                <div key={i} style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#f9fafb', borderRadius: '14px', padding: '18px', marginBottom: '12px', border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: isDark ? '#cbd5e1' : '#374151' }}>{c.name}</span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: isDark ? '#f1f5f9' : '#111827' }}>{c.value}%</span>
                  </div>
                  <div style={{ height: '16px', background: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${c.value}%`, height: '100%', background: c.color, borderRadius: '8px' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={styles.modalFooter}><button onClick={() => setShowEvaluation(false)} style={styles.confirmBtn}>Fermer</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;