import { MoreVertical, Trash2 } from 'lucide-react';
import { type Avatar } from '../../types/avatar';
import { useApp } from '../../providers/ContextProvider';
import { ThemeColor } from '../../types/settings';
import { AvatarGender } from '../../types/avatar';
import type { FirestoreTimestamp } from '../../types/firestore';
import { useEffect, useState } from 'react';
import { getMediaUrlFromPath } from '../../services/storage';

type PropType = {
    avatar: Avatar;
    onDelete: (id: string) => void;
}

const AvatarCard = ({ avatar, onDelete }: PropType) => {
  const { theme } = useApp();
  const [loadingDelete, setLoadingDelete] = useState(false);

  const getAvatarDefaultImage = () => {
    const isDark = theme === ThemeColor.Dark;
    if (avatar.parameters.gender === AvatarGender.male) {
      return isDark ? '/avatar-male-2.png' : '/avatar-male.png';
    }
    return isDark ? '/avatar-female-2.png' : '/avatar-female.png';
  }

  const [imageSrc, setImageSrc] = useState(() => getAvatarDefaultImage());

  useEffect(() => {
    getAvatarImage();
  }, [])

  const getAvatarImage = async () => {
    if (!avatar.mainImagePath) return;

    const frontPictureUrl = await getMediaUrlFromPath(avatar.mainImagePath);
    setImageSrc(frontPictureUrl);
  }

  const deleteAvatar = async () => {
    setLoadingDelete(true);
    await onDelete(avatar.id!);
    setLoadingDelete(false);
  }

  return (
    <div className="group card bg-base-100 w-full h-[450px] shadow-md transition-all duration-300 relative rounded-2xl overflow-hidden active:scale-[0.99] hover:bg-base-200 cursor-pointer">
      
      {/* 3-DOT MENU - Absolute positioned top right */}
      <div className="absolute top-5 right-5 z-[60]">
        <div className="dropdown dropdown-end group/menu"> 
          <label 
            tabIndex={0} 
            className="
                btn btn-circle btn-ghost btn-sm 
                bg-base-100/20 backdrop-blur-md border border-white/10 
                hover:bg-base-100/60 hover:border-white/20
                text-base-content transition-all duration-300
                group-hover/menu:rotate-90 group-hover/menu:scale-110
            "
          >
            <MoreVertical size={18} className="transition-transform duration-500" />
          </label>
          
          <ul tabIndex={0} className="
            dropdown-content z-[100] menu p-2 shadow-2xl 
            bg-base-100/95 backdrop-blur-xl rounded-xl w-52 
            border border-base-content/5 mt-2
            animate-in fade-in zoom-in-95 duration-200 origin-top-right
          ">
            {/* DELETE ITEM */}
            <li className="animate-in slide-in-from-top-2 duration-300 delay-150">
                <button 
                    onClick={(e) => {
                        e.stopPropagation(); 
                        onDelete?.(avatar.id!);
                    }}
                    className="flex items-center justify-between text-error hover:bg-error/10 transition-colors py-3 group/del"
                >
                    <span className="text-xs font-semibold tracking-[0.1em]">Delete Avatar</span>
                    <Trash2 size={14} className="opacity-40 group-hover/del:opacity-100 transition-opacity" />
                </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Card Interaction Area */}
      <button className="w-full h-full text-left focus:outline-none overflow-hidden rounded-2xl relative cursor-pointer">
        {/* Hover Border Highlight */}
        <div className="absolute inset-0 z-50 pointer-events-none rounded-2xl border-2 border-transparent group-hover:border-primary/40 transition-colors duration-300" />
        
        {/* Animated Background Glow */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_50%_120%,rgba(var(--p),0.12),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Grid Texture Overlay */}
        <div className="absolute inset-0 z-10 opacity-[0.02] pointer-events-none" 
            style={{ backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />

        <figure className="h-full w-full overflow-hidden bg-base-300 relative">
          <img 
            src={imageSrc}
            alt={avatar.name} 
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-1000 ease-out" 
          />
          
          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-base-100 group-hover:from-base-200 via-base-100/5 to-transparent z-20 transition-colors duration-300" />
          
          <div className="absolute bottom-4 left-7 right-7 z-30">
            <h2 className="text-xl font-medium uppercase tracking-[0.2em] text-base-content drop-shadow-md truncate flex items-center">
              {avatar.name}
            </h2>
          </div>
        </figure>
        
        {/* Animated Bottom Border Loading-style accent */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out z-50" />
      </button>
    </div>
  )
};

export default AvatarCard;