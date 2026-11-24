import { defineAdventureGame } from '@wp/adventure-engine';
import { prologueArt } from './art';
import { content } from './content';
import { metadata } from './metadata';
import { PROLOGUE } from './structure';

export default defineAdventureGame({ metadata, adventure: PROLOGUE, art: prologueArt, content });
