import React from 'react';

/**
 * Avatar - simple avatar with initials fallback and optional online dot
 * props:
 *  - name (string)
 *  - src (string) optional image URL
 *  - size (sm|md|lg)
 *  - online (bool)
 */
export default function Avatar({ name = '', src = '', size = 'md', online = false, className = '' }) {
  const sizes = {
    sm: 'w-7 h-7 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };
  const initials = name ? name.split(' ').map(s => s[0]).slice(0, 2).join('') : 'RB';

  return (
    <div className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-white/6 to-white/3 border border-white/10 ${sizes[size]} ${className}`}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover rounded-full" />
      ) : (
        <span className="font-semibold text-gray-900 dark:text-gray-100">{initials}</span>
      )}

      {online && (
        <span className="absolute bottom-0 right-0 block w-3 h-3 rounded-full ring-2 ring-white bg-green-400"></span>
      )}
    </div>
  );
}
