import type { PetSpecies } from '../../types/pet';

export type PetSpeciesMeta = {
  key: PetSpecies;
  label: string;
  previewCopy: string;
  companionNoun: string;
  spritePath: string;
  feedPropClass: string;
  feedPropLabel: string;
  playPropClass: string;
  playPropLabel: string;
  cleanPropClass: string;
  cleanPropLabel: string;
  restPropClass: string;
  restPropLabel: string;
};

export const PET_SPECIES_OPTIONS: PetSpeciesMeta[] = [
  {
    key: 'cat',
    label: '小猫',
    previewCopy: '橙白大脑袋，像图里那种乖巧像素贴纸',
    companionNoun: '小猫',
    spritePath: '/sprites/cat.png',
    feedPropClass: 'scene-prop--cat-bowl',
    feedPropLabel: '猫咪食盆',
    playPropClass: 'scene-prop--cat-yarn',
    playPropLabel: '毛线球',
    cleanPropClass: 'scene-prop--cat-bath',
    cleanPropLabel: '猫咪泡泡盆',
    restPropClass: 'scene-prop--cat-bed',
    restPropLabel: '猫咪软垫'
  },
  {
    key: 'dog',
    label: '小狗',
    previewCopy: '圆脸垂耳，像图里那只温顺的小像素狗',
    companionNoun: '小狗',
    spritePath: '/sprites/dog.png',
    feedPropClass: 'scene-prop--dog-bowl',
    feedPropLabel: '狗狗食盆',
    playPropClass: 'scene-prop--dog-bone',
    playPropLabel: '磨牙骨头',
    cleanPropClass: 'scene-prop--dog-bath',
    cleanPropLabel: '冲洗浴盆',
    restPropClass: 'scene-prop--dog-bed',
    restPropLabel: '狗狗睡垫'
  },
  {
    key: 'pig',
    label: '小猪',
    previewCopy: '粉粉圆脸和小鼻子，做成像素宠物会很有喜感',
    companionNoun: '小猪',
    spritePath: '/sprites/pig.png',
    feedPropClass: 'scene-prop--pig-bucket',
    feedPropLabel: '小猪食桶',
    playPropClass: 'scene-prop--pig-ball',
    playPropLabel: '泥巴球',
    cleanPropClass: 'scene-prop--pig-bubbles',
    cleanPropLabel: '香波泡泡',
    restPropClass: 'scene-prop--pig-blanket',
    restPropLabel: '小猪毯子'
  },
  {
    key: 'fox',
    label: '小狐狸',
    previewCopy: '尖耳朵和大尾巴，最适合做亮橙色像素贴纸',
    companionNoun: '小狐狸',
    spritePath: '/sprites/fox.png',
    feedPropClass: 'scene-prop--fox-berries',
    feedPropLabel: '浆果小盘',
    playPropClass: 'scene-prop--fox-feather',
    playPropLabel: '逗狐羽毛',
    cleanPropClass: 'scene-prop--fox-ribbon',
    cleanPropLabel: '梳毛丝带',
    restPropClass: 'scene-prop--fox-cushion',
    restPropLabel: '狐狸抱枕'
  },
  {
    key: 'turtle',
    label: '小乌龟',
    previewCopy: '圆脑袋配深绿龟壳，节奏慢一点反而更可爱',
    companionNoun: '小乌龟',
    spritePath: '/sprites/turtle.png',
    feedPropClass: 'scene-prop--turtle-lettuce',
    feedPropLabel: '生菜小盘',
    playPropClass: 'scene-prop--turtle-leaf',
    playPropLabel: '叶片风车',
    cleanPropClass: 'scene-prop--turtle-brush',
    cleanPropLabel: '龟壳刷',
    restPropClass: 'scene-prop--turtle-mat',
    restPropLabel: '晒背软垫'
  }
];

export function getPetSpeciesMeta(species: PetSpecies): PetSpeciesMeta {
  return PET_SPECIES_OPTIONS.find((item) => item.key === species) ?? PET_SPECIES_OPTIONS[0];
}

export function isPetSpecies(value: unknown): value is PetSpecies {
  return PET_SPECIES_OPTIONS.some((item) => item.key === value);
}
