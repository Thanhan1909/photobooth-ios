'use strict';
/**
 * Personal user-supplied reference image window definitions.
 * No Pinterest image files are included with the public application.
 * Coordinates are fractions of each user's original flattened JPG.
 * Users may readjust the windows in the editor and save as private templates.
 */
window.BloomPersonalFrameDefs=Object.freeze([
 {number:1,name:'Bộ hoạt hình hồng (2 strip)',slots:[[.080,.092,.316,.171],[.080,.295,.316,.157],[.080,.493,.316,.161],[.080,.694,.316,.163],[.525,.226,.395,.452]]},
 {number:2,name:'Hoa ép thư tình',slots:[[.225,.165,.535,.210],[.225,.450,.535,.212]]},
 {number:3,name:'Film đen trắng & sticker',slots:[[.112,.070,.305,.180],[.112,.295,.305,.181],[.112,.543,.305,.182],[.557,.058,.347,.205],[.557,.303,.347,.204],[.557,.563,.347,.198]]},
 {number:4,name:'Film 35mm 3 tấm',slots:[[.133,.030,.730,.282],[.133,.355,.730,.278],[.133,.682,.730,.275]]},
 {number:5,name:'Vé Theater Show 8 tấm',slots:[[.074,.179,.353,.154],[.074,.350,.353,.154],[.074,.519,.353,.151],[.074,.682,.353,.153],[.577,.179,.345,.154],[.577,.350,.345,.154],[.577,.519,.345,.151],[.577,.682,.345,.153]]},
 {number:6,name:'Máy ảnh dây đỏ và thú bông',slots:[[.313,.281,.385,.155],[.333,.465,.359,.153],[.333,.660,.357,.155]]},
 {number:7,name:'Film đỏ tình yêu',slots:[[.222,.031,.550,.240],[.222,.296,.550,.232],[.222,.564,.550,.238]]},
 {number:8,name:'Máy Polaroid giấy ô vuông',slots:[[.353,.300,.310,.124],[.353,.432,.310,.123],[.353,.565,.310,.126]]},
 {number:9,name:'Caro hồng 6 Polaroid',slots:[[.115,.041,.365,.206],[.565,.047,.368,.211],[.115,.377,.365,.216],[.585,.388,.348,.214],[.115,.719,.365,.204],[.568,.719,.368,.204]]},
 {number:10,name:'Cinema dâu tây',slots:[[.530,.150,.354,.211],[.525,.514,.355,.166],[.080,.718,.365,.186]]},
 {number:11,name:'Scrapbook xanh mèo 5 ảnh',slots:[[.120,.176,.355,.205],[.586,.060,.334,.200],[.594,.339,.325,.193],[.052,.528,.325,.212],[.600,.691,.325,.195]]},
 {number:12,name:'Hello Kitty hồng 6 ô',slots:[[.048,.055,.420,.172],[.539,.055,.415,.172],[.048,.272,.420,.165],[.539,.272,.415,.165],[.048,.469,.420,.188],[.539,.469,.415,.188]]},
 {number:13,name:'Polaroid Hello Kitty 8 ảnh',slots:[[.177,.097,.299,.133],[.702,.091,.229,.142],[.070,.302,.282,.161],[.364,.291,.300,.174],[.720,.344,.226,.144],[.103,.561,.265,.157],[.707,.641,.225,.164],[.332,.788,.253,.128]]},
 {number:14,name:'Vintage tim và 2 Polaroid',slots:[[.065,.125,.488,.274],[.467,.551,.459,.270]]}
] .map(def=>Object.freeze({...def,slots:Object.freeze(def.slots.map((v,i)=>Object.freeze({x:v[0],y:v[1],w:v[2],h:v[3],rotation:({11:[-9,10,9,-15,12],13:[-3,10,-13,8,11,-5,-12,6]}[def.number]||[])[i]||0})))})));
