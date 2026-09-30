import numpy as np, cv2, sys
from PIL import Image
src=np.array(Image.open('src.png').convert('RGB')).astype(np.float32)
Q={'front':(3,3,760,504),'q34':(773,3,1533,504),'side':(3,513,760,1021),'led':(773,513,1533,1021)}
T=float(sys.argv[1]) if len(sys.argv)>1 else 18
def cut(name,box):
    x0,y0,x1,y1=box; a=src[y0:y1,x0:x1].copy()
    edge=np.concatenate([a[:3].reshape(-1,3),a[-3:].reshape(-1,3),a[:,:3].reshape(-1,3),a[:,-3:].reshape(-1,3)])
    bg=np.median(edge,axis=0)
    d=np.sqrt(((a-bg)**2).sum(-1))
    R,G,B=a[...,0],a[...,1],a[...,2]
    pinkl=((R-G)>22)&(a.mean(-1)>185)&((R-B)>10)
    near=((d<T)|pinkl).astype(np.uint8)
    n,lab=cv2.connectedComponents(near,connectivity=4)
    border=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bgm=np.isin(lab,list(border))
    close=((d<11)|pinkl).astype(np.uint8)
    n2,lab2,st,_=cv2.connectedComponentsWithStats(close,connectivity=4)
    for i in range(1,n2):
        if st[i,cv2.CC_STAT_AREA]>120: bgm|=lab2==i
    obj=(~bgm).astype(np.uint8)
    obj=cv2.morphologyEx(obj,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
    # garder la/les grandes composantes
    n3,lab3,st3,_=cv2.connectedComponentsWithStats(obj,connectivity=8)
    keep=np.zeros_like(obj)
    for i in range(1,n3):
        if st3[i,cv2.CC_STAT_AREA]>3000: keep[lab3==i]=1
    alpha=cv2.GaussianBlur(keep.astype(np.float32),(0,0),1.0)
    rgba=np.dstack([a,alpha*255]).clip(0,255).astype(np.uint8)
    im=Image.fromarray(rgba,'RGBA'); bb=im.getbbox(); im=im.crop(bb); im.save(name+'_cut.png'); print(name,bb)
for k,v in Q.items(): cut(k,v)
out=Image.new('RGB',(4*420,520),(142,75,87)); x=0
for n in Q:
    im=Image.open(n+'_cut.png'); im.thumbnail((400,500)); out.paste(im,(x+10,10),im); x+=420
out.save('check.png')
