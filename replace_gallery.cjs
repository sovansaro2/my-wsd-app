const fs = require('fs');
let code = fs.readFileSync('src/components/Feed.tsx', 'utf8');

const newGallery = `      {activeGallery && (
        <div className="fixed inset-0 z-[70] bg-black flex flex-col font-battambang animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent absolute top-0 left-0 right-0 z-20">
            <button 
              onClick={() => setActiveGallery(null)} 
              className="p-2 text-white hover:bg-white/20 rounded-full transition-colors backdrop-blur-md bg-black/20"
            >
              <X className="w-6 h-6"/>
            </button>
            <div className="text-white text-sm font-medium bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">
              {activeGallery.initialIndex + 1} / {activeGallery.urls.length}
            </div>
            <div className="w-10"></div> {/* Placeholder for balance */}
          </div>
          
          <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden relative"
               onTouchStart={(e) => {
                 setTouchEnd(null);
                 setTouchStart(e.targetTouches[0].clientX);
               }}
               onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
               onTouchEnd={() => {
                 if (!touchStart || !touchEnd) return;
                 const distance = touchStart - touchEnd;
                 const isLeftSwipe = distance > 50;
                 const isRightSwipe = distance < -50;
                 if (isLeftSwipe && activeGallery.initialIndex < activeGallery.urls.length - 1) {
                   setActiveGallery({ ...activeGallery, initialIndex: activeGallery.initialIndex + 1 });
                 }
                 if (isRightSwipe && activeGallery.initialIndex > 0) {
                   setActiveGallery({ ...activeGallery, initialIndex: activeGallery.initialIndex - 1 });
                 }
               }}
          >
            <img 
              key={activeGallery.initialIndex}
              loading="lazy" 
              src={activeGallery.urls[activeGallery.initialIndex]} 
              className="w-full h-full object-contain animate-in fade-in duration-200" 
              alt="Full view" 
            />
            {/* Arrows for Desktop */}
            {activeGallery.initialIndex > 0 && (
               <button onClick={(e) => { e.stopPropagation(); setActiveGallery({...activeGallery, initialIndex: activeGallery.initialIndex - 1}); }} className="absolute left-4 p-3 bg-black/40 text-white hover:bg-black/60 transition-colors rounded-full hidden sm:block"><ChevronLeft className="w-6 h-6"/></button>
            )}
            {activeGallery.initialIndex < activeGallery.urls.length - 1 && (
               <button onClick={(e) => { e.stopPropagation(); setActiveGallery({...activeGallery, initialIndex: activeGallery.initialIndex + 1}); }} className="absolute right-4 p-3 bg-black/40 text-white hover:bg-black/60 transition-colors rounded-full hidden sm:block"><ChevronRight className="w-6 h-6"/></button>
            )}
          </div>
        </div>
      )}`;

const parts = code.split('      {/* FULLSCREEN IMAGE GALLERY MODAL */}');
if (parts.length > 1) {
    const after = parts[1];
    const split2 = after.split('      {/* SHARE MODAL */}');
    if (split2.length > 1) {
       code = parts[0] + '      {/* FULLSCREEN IMAGE GALLERY MODAL */}\n' + newGallery + '\n\n      {/* SHARE MODAL */}' + split2[1];
       fs.writeFileSync('src/components/Feed.tsx', code);
       console.log('Successfully replaced');
    } else { console.log('SHARE MODAL not found'); }
} else { console.log('FULLSCREEN IMAGE GALLERY MODAL not found'); }
