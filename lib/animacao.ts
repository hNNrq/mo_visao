/**
 * Os tempos da entrada da hero, num lugar só.
 *
 * A frase de efeito só começa quando o nome termina de sair do desfoque. As duas
 * peças moram em arquivos diferentes (`Abertura` e a home), então o número que
 * amarra uma na outra fica aqui — mudar a duração do nome empurra a frase junto.
 *
 * ⚠️ Não mover isto pra dentro de um arquivo `"use client"`: componente de
 * servidor que importa constante de módulo cliente recebe uma referência, não o
 * número.
 */

/** Segundos que o nome da loja leva pra sair do desfoque. */
export const DURACAO_NOME = 1;
