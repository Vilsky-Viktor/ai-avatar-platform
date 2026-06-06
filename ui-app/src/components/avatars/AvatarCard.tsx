import { Trash2 } from 'lucide-react';
import { type Avatar, AvatarGender } from '@loom24/shared/types';
import { useApp } from '../../providers/ContextProvider';
import { ThemeColor } from '../../types/settings';
import { useEffect, useState } from 'react';
import { getMediaUrlFromPath } from '../../services/storage';
import { useNavigate } from 'react-router-dom';

type PropType = {
    avatar: Avatar;
    onDelete: (id: string) => void;
}

const AvatarCard = ({ avatar, onDelete }: PropType) => {
  const { theme } = useApp();
  const navigate = useNavigate();

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

  return (
    <div className="group card bg-base-100 w-full h-[450px] shadow-md transition-all duration-300 relative rounded-2xl overflow-hidden active:scale-[0.99] hover:bg-base-200 cursor-pointer">
      
      <button
        onClick={(e) => { e.stopPropagation(); onDelete?.(avatar.id!); }}
        className="absolute top-4 right-4 z-[60] w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-error transition-all cursor-pointer"
      >
        <Trash2 size={15} className="text-white" />
      </button>

      {/* Main Card Interaction Area */}
      <button
        className={`w-full h-full text-left focus:outline-none overflow-hidden rounded-2xl relative ${avatar.voiceId ? 'cursor-pointer' : 'cursor-default'}`}
        disabled={!avatar.voiceId}
        onClick={() => avatar.voiceId && navigate(`/avatar/${avatar.slug}`)}
      >
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