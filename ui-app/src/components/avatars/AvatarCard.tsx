import { Image, Video, Calendar } from 'lucide-react';
import { type Avatar, AvatarStatus } from '../../types/avatar';
import { useApp } from '../../providers/ContextProvider';
import { ThemeColor } from '../../types/settings';
import { AvatarGender } from '../../types/avatar';
import type { FirestoreTimestamp } from '../../types/firestore';

type PropType = {
    avatar: Avatar;
}

const AvatarCard = ({ avatar }: PropType) => {
  const { theme } = useApp();

  const getStatus = () => {
    if (avatar.status === AvatarStatus.error) {
      return 'status-error';
    } else if (avatar.status === AvatarStatus.trained) {
      return 'status-success';
    } else {
      return 'status-warning';
    }
  }

  const getAvatarImage = () => {
    if (avatar.image) {
      return avatar.image;
    }

    if (theme === ThemeColor.Dark && avatar.gender === AvatarGender.male) {
      return '/avatar-male-2.png'
    } else if (theme === ThemeColor.Dark && avatar.gender === AvatarGender.female) {
      return '/avatar-female-2.png'
    } else if (theme === ThemeColor.Light && avatar.gender === AvatarGender.male) {
      return '/avatar-male.png'
    } else {
      return '/avatar-female.png' 
    }
  }

  const getRelativeAge = (dateInput: FirestoreTimestamp): string => {
    if (!dateInput) return 'n/a';

    const date = new Date(dateInput._seconds * 1000);

    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInDays = Math.floor(diffInSeconds / 86400);
    const diffInMonths = Math.floor(diffInDays / 30.44);
    const diffInYears = Math.floor(diffInDays / 365.25);

    if (diffInDays < 30) {
      return `${Math.max(0, diffInDays)}d`;
    } else if (diffInMonths < 12) {
      return `${diffInMonths}m`;
    } else {
      return `${diffInYears}y`;
    }
  };

  return (
    <button className="
      group card bg-base-100 w-full h-[450px] shadow-md transition-all duration-300 
      cursor-pointer overflow-hidden relative rounded-2xl text-left
      active:scale-[0.98] hover:bg-base-200 focus:outline-none
    ">
      
      <div className="
          absolute inset-0 z-50 pointer-events-none 
          rounded-2xl border-2 border-transparent 
          group-hover:border-primary/50 transition-colors duration-300
      " />

      <div className="absolute inset-0 z-10 pointer-events-none bg-[radial-gradient(circle_at_50%_120%,rgba(var(--p),0.15),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute inset-0 z-10 opacity-[0.03] pointer-events-none" 
          style={{ backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />

      <figure className="h-[88%] w-full overflow-hidden bg-base-300 relative">
        <img 
          src={getAvatarImage()}
          alt={name} 
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out" 
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-base-100 group-hover:from-base-200 via-base-100/10 to-transparent z-20 transition-colors duration-300" />
        
        <div className="absolute bottom-2 left-6 right-6 z-30">
          <h2 className="text-xl font-medium uppercase tracking-[0.2em] text-base-content drop-shadow-md truncate">
            {avatar.name}
            <div className={`status mb-1 ml-2 opacity-50 ${getStatus()}`}></div>
          </h2>
        </div>
      </figure>

      <div className="h-[12%] flex items-center px-7 relative z-20">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Image size={20} strokeWidth={1.5} className="text-primary" />
            <span className="text-sm font-semibold">{avatar.imageCount}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Video size={20} strokeWidth={1.5} className="text-primary" />
            <span className="text-sm font-semibold">{avatar.videoCount}</span>
          </div>

          <div className="flex items-center gap-2">
            <Calendar size={20} strokeWidth={1.5} className="text-primary" />
            <span className="text-sm font-semibold">{getRelativeAge(avatar.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out z-50" />
    </button>
  )
};

export default AvatarCard;