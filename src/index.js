let scrollbar, screenshotView, lens, triggerZone, isDragging = false;
let hideOnMouseOverTimeout, mouseOverDebounceTimeout;

const DEFAULTS = {
    enabled: true,
    width: 180,
    triggerZoneWidth: 18,
    hoverDelay: 60,
    hideDelay: 150,
};

// Start with defaults immediately (synchronous for document_start performance)
let configs = { ...DEFAULTS };

function applyConfig() {
    document.documentElement.style.setProperty('--lens-scrollbar-width', `${configs.width}px`);
    document.documentElement.style.setProperty('--lens-scrollbar-collapsed-width', `${configs.triggerZoneWidth}px`);
    // Update scrollbar width directly if it already exists
    if (scrollbar) {
        scrollbar.style.width = `${configs.width}px`;
    }
}

applyConfig();

// Asynchronously load saved preferences from storage, overriding defaults
browser.storage.sync.get(DEFAULTS).then((stored) => {
    const changed = Object.keys(stored).some(k => stored[k] !== configs[k]);
    if (!changed) return;
    configs = { ...stored };
    applyConfig();
});

document.addEventListener('DOMContentLoaded', function () {
    if (configs.enabled) {
        addTriggerZone();
        addScrollbar();
        addLens();
        setMouseListeners();
    }
});

let captured = false;
const CHUNK_HEIGHT = window.innerHeight;

function capturePage() {
    captured = true;
    let pageHeight = document.body.scrollHeight;
    let chunksCount = 0;
    let currentY = 0;

    chunksCount = pageHeight / CHUNK_HEIGHT;
    document.documentElement.style.setProperty('--scroll-lense-img-chunk-height', `calc(100vh / ${chunksCount})`);

    const prevImages = scrollbar.querySelectorAll('img')
    prevImages.forEach(element => {
        element.remove();
    });
 
    function capturePagePart(){
        chrome.runtime.sendMessage({
            actionToDo: 'captureTab',
            width: window.innerWidth,
            height: CHUNK_HEIGHT,
            top: parseInt(currentY)
        }, (data) => {
            if (data == undefined) return;
            if (scrollbar) {
                const img = document.createElement('img');
                img.className = 'scrollbar-lense-screenshot-chunk';
                img.src = data;
    
                scrollbar.appendChild(img);
                currentY += CHUNK_HEIGHT;
    
                if (currentY < pageHeight) {
                    capturePagePart();
                } else {
                    currentY = 0;
                    lens.style.height = `${window.innerHeight * (window.innerHeight / document.body.scrollHeight)}px`;
                }
            } 
        });
    }
    capturePagePart();
    
}

function addTriggerZone(){
    triggerZone = document.createElement('div');
    triggerZone.className = 'lens-scrollbar-trigger';
    document.body.appendChild(triggerZone);
}

function addScrollbar() {
    scrollbar = document.createElement('div');
    scrollbar.className = 'lens-scrollbar';
    scrollbar.style.width = `${configs.width}px`;
    document.body.appendChild(scrollbar);
    setScrollbarClickListener();
}

function addLens() {
    lens = document.createElement('div');
    lens.className = 'lens-overlay';

    lens.style.height = `${window.innerHeight * (window.innerHeight / document.body.scrollHeight)}px`;
    setLensOverlayPosition();
    scrollbar.appendChild(lens);
}

function setLensOverlayPosition() {
    const scrollbarHeight = scrollbar.clientHeight;
    lens.style.top = `${(window.scrollY * scrollbarHeight) / document.body.scrollHeight}px`;
}

function setMouseListeners() {
    window.addEventListener('scroll', ()=>{
        setLensOverlayPosition();
    }, true);
}

function setScrollbarClickListener() {
    scrollbar.addEventListener('mousedown', (e)=>{
        isDragging = true;
        const scrollbarHeight = scrollbar.clientHeight;
        window.scrollTo({
            top: (Math.round(e.clientY * document.body.scrollHeight) / scrollbarHeight) - (window.innerHeight / 2),
            behavior: "smooth"
        });

        document.addEventListener('mousemove', mouseMoveListener);
    });

    document.addEventListener('mouseup', ()=>{
        if (isDragging) {
            isDragging = false;
            document.removeEventListener('mousemove', mouseMoveListener);
        }
    });

    scrollbar.addEventListener('selectstart', e => e.preventDefault())

    scrollbar.addEventListener("dragstart", (e)=>{
        e.preventDefault();
    }, true);

    triggerZone.addEventListener("mouseenter", ()=>{
        clearTimeout(mouseOverDebounceTimeout);
        mouseOverDebounceTimeout = setTimeout(()=>{
            if (document.body.scrollHeight > (window.innerHeight * 2.5)) {
                capturePage();
                revealScrollbar();
            }
        }, configs.hoverDelay);
        clearTimeout(hideOnMouseOverTimeout);
    });

    scrollbar.addEventListener("mouseout", ()=>{
        clearTimeout(hideOnMouseOverTimeout);
        hideOnMouseOverTimeout = setTimeout(()=>{
            if (bodyIsHovered == true) hideScrollbar();
        }, configs.hideDelay);
    })

    let bodyIsHovered = true;
    document.body.addEventListener('mouseover', ()=> bodyIsHovered = true)
    document.body.addEventListener('mouseout', ()=> bodyIsHovered = false)

    function mouseMoveListener(e) {
        if (isDragging) 
            window.scrollTo({
                top: (Math.round(e.clientY * document.body.scrollHeight) / window.innerHeight) - (window.innerHeight / 2),
                behavior: "instant"
            });
    }

    function revealScrollbar(){
        scrollbar.classList.add('revealed-lens-scrollbar')
    }
    function hideScrollbar(){
        scrollbar.classList.remove('revealed-lens-scrollbar');
    }
}