import { useState } from 'react';
import type { PetGender, PetSpecies } from '../../types/pet';

type IdentitySetupFormProps = {
  onSubmit: (name: string, gender: PetGender, species: PetSpecies) => void;
};

export function IdentitySetupForm({ onSubmit }: IdentitySetupFormProps) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<PetGender>('unknown');
  const [species, setSpecies] = useState<PetSpecies>('cat');

  return (
    <section className="setup-card">
      <div className="setup-copy">
        <p className="eyebrow">FIRST HELLO</p>
        <h1>给你的新宠物一个名字</h1>
        <p>
          首版先用轻量身份设定开始，不把第一次见面做成复杂表单。
          你只需要给它一个名字，选它是小猫还是小狗，再决定它想被怎样介绍。
        </p>
      </div>

      <div className="field">
        <span>宠物类型</span>
        <div className="species-grid">
          <button
            className={species === 'cat' ? 'species-card is-active' : 'species-card'}
            onClick={() => setSpecies('cat')}
            type="button"
          >
            <span className="species-icon">=^.^=</span>
            <strong>小猫</strong>
            <small>更像安静又灵巧的像素精灵</small>
          </button>
          <button
            className={species === 'dog' ? 'species-card is-active' : 'species-card'}
            onClick={() => setSpecies('dog')}
            type="button"
          >
            <span className="species-icon">Uo･ｪ･oU</span>
            <strong>小狗</strong>
            <small>更像热情又爱跑动的像素伙伴</small>
          </button>
        </div>
      </div>

      <label className="field">
        <span>宠物名字</span>
        <input
          value={name}
          maxLength={14}
          placeholder="例如 Mochi、团子、小码农"
          onChange={(event) => setName(event.target.value)}
        />
      </label>

      <div className="field">
        <span>性别表达</span>
        <div className="segmented">
          <button
            className={gender === 'boy' ? 'segment is-active' : 'segment'}
            onClick={() => setGender('boy')}
            type="button"
          >
            男孩
          </button>
          <button
            className={gender === 'girl' ? 'segment is-active' : 'segment'}
            onClick={() => setGender('girl')}
            type="button"
          >
            女孩
          </button>
          <button
            className={gender === 'unknown' ? 'segment is-active' : 'segment'}
            onClick={() => setGender('unknown')}
            type="button"
          >
            未说明
          </button>
        </div>
      </div>

      <button
        className="toy-button toy-button--accent setup-submit"
        onClick={() => onSubmit(name, gender, species)}
        type="button"
      >
        开始照顾它
      </button>
    </section>
  );
}
