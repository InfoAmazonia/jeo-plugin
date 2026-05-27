import { Star, MoreVertical, X } from 'lucide-react'

/**
 * Stylized WordPress (Gutenberg) editor — a crisp CSS/SVG recreation of the
 * screenshot in the design, kept as markup so it stays sharp on any display.
 */
export default function EditorMock() {
  return (
    <div className="overflow-hidden rounded-xl bg-[#2b2f33] p-2 shadow-2xl ring-1 ring-white/10">
      {/* window chrome */}
      <div className="flex items-center gap-1.5 px-2 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
      </div>

      <div className="grid grid-cols-[1fr_180px] overflow-hidden rounded-md bg-white">
        {/* Article canvas */}
        <div className="p-5 text-[#1e1e1e]">
          <p className="text-[10px] leading-relaxed text-[#3c4043]">
            criação de hidrovias e desvios para irrigação.
          </p>
          <p className="mt-3 text-[10px] leading-relaxed text-[#3c4043]">
            “A região onde a situação é crítica e ainda há grande oportunidade
            para ação é a América do Sul”, afirmou o autor principal do estudo,{' '}
            <span className="underline decoration-dotted">Zeb Hogan</span>, da
            Universidade de Nevada, nos Estados Unidos, durante o lançamento do
            relatório.
          </p>
          <p className="mt-3 text-[10px] leading-relaxed text-[#3c4043]">
            Ele se refere principalmente ao fato de na região ainda existirem
            muitas bacias onde a conectividade dos rios está preservada. Isso é
            especialmente verdadeiro na Amazônia, bioma onde estão algumas das
            espécies de peixes de água doce que realizam as maiores migrações já
            registradas.
          </p>
          <div className="mt-3 h-2.5 w-3/4 rounded-sm bg-[#eceff1]" />
          <div className="mt-1.5 h-2.5 w-2/3 rounded-sm bg-[#eceff1]" />
        </div>

        {/* Settings sidebar */}
        <aside className="border-l border-[#e0e0e0] bg-[#f6f7f7] p-3 text-[#1e1e1e]">
          <div className="flex items-center justify-between text-[9px] font-medium">
            <div className="flex gap-3">
              <span className="border-b-2 border-[#1e1e1e] pb-1">Post</span>
              <span className="text-[#757575]">Bloco</span>
            </div>
            <X className="h-3 w-3 text-[#757575]" />
          </div>

          <div className="mt-3 flex items-start gap-2 rounded border border-[#e0e0e0] bg-white p-2">
            <div className="mt-0.5 h-3 w-3 shrink-0 rounded-sm bg-[#2271b1]" />
            <p className="text-[8px] leading-tight text-[#3c4043]">
              Teste 22/5/26 Peixes migratórios colapsam e colocam a Amazônia no
              centro da crise
            </p>
            <MoreVertical className="h-3 w-3 shrink-0 text-[#757575]" />
          </div>

          <button className="mt-2 w-full rounded border border-[#1e1e1e]/15 bg-white py-1.5 text-[9px] font-medium text-[#1e1e1e]">
            Definir imagem destacada
          </button>

          <p className="mt-3 text-[8px] font-semibold uppercase tracking-wide text-[#757575]">
            Featured image position
          </p>
          <ul className="mt-1.5 space-y-1.5 text-[9px] text-[#3c4043]">
            {[
              ['Default (set in Customizer)', true],
              ['Amplo', false],
              ['Pequeno', false],
              ['Behind article title', false],
            ].map(([label, on]) => (
              <li key={label} className="flex items-center gap-1.5">
                <span
                  className={`flex h-3 w-3 items-center justify-center rounded-full border ${
                    on ? 'border-[#2271b1]' : 'border-[#9aa0a6]'
                  }`}
                >
                  {on && <span className="h-1.5 w-1.5 rounded-full bg-[#2271b1]" />}
                </span>
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-center gap-1 text-[8px] text-[#2271b1]">
            <Star className="h-2.5 w-2.5 fill-current" />
            <span>resumo… · tempo de leitura de 3</span>
          </div>
          <div className="mt-2 border-t border-[#e0e0e0] pt-2 text-[8px] text-[#3c4043]">
            <div className="flex justify-between">
              <span className="font-medium">Publicar</span>
              <span className="text-[#2271b1]">22 de maio, 14:53</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="font-medium">Slug</span>
              <span className="text-right text-[#2271b1]">
                teste-22-5-26-peixes-migratorios-colapsam-e-colocam-a
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
