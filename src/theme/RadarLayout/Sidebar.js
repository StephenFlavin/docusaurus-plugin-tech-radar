import React, { useState } from 'react';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';

export function SidebarItems({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <ul className="radar-sidebar-list">
      {items.map(item => (
        <SidebarItem key={item.href || item.label} item={item} />
      ))}
    </ul>
  );
}

function SidebarItem({ item }) {
  const location = useLocation();
  const isActive = item.href && location.pathname === item.href;

  if (item.type === 'link') {
    return (
      <li className="radar-sidebar-item">
        <Link
          to={item.href}
          className={`radar-sidebar-link ${isActive ? 'radar-sidebar-link--active' : ''}`}
        >
          {item.label}
          {item.ring && <RingDot ring={item.ring} />}
        </Link>
      </li>
    );
  }

  if (item.type === 'category') {
    return <SidebarCategory item={item} />;
  }

  return null;
}

function SidebarCategory({ item }) {
  const location = useLocation();
  const isChildActive = hasActiveChild(item, location.pathname);
  const [open, setOpen] = useState(isChildActive || !item.collapsed);

  return (
    <li className="radar-sidebar-item">
      <div className="radar-sidebar-category-header">
        {item.href ? (
          <Link
            to={item.href}
            className={`radar-sidebar-link radar-sidebar-category-label ${
              location.pathname === item.href ? 'radar-sidebar-link--active' : ''
            }`}
          >
            {item.label}
          </Link>
        ) : (
          <button
            className="radar-sidebar-link radar-sidebar-category-label radar-sidebar-category-label--toggle"
            onClick={() => setOpen(!open)}
          >
            {item.label}
          </button>
        )}
        <button
          className={`radar-sidebar-toggle ${open ? 'radar-sidebar-toggle--open' : ''}`}
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M4.5 3L7.5 6L4.5 9" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
      {open && <SidebarItems items={item.items} />}
    </li>
  );
}

function hasActiveChild(item, pathname) {
  if (item.href === pathname) return true;
  return item.items ? item.items.some(child => hasActiveChild(child, pathname)) : false;
}

function RingDot({ ring }) {
  return <span className={`radar-ring-dot radar-ring-dot--${ring}`} />;
}
