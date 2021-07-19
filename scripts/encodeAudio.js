const ffmpeg = require('ffmpeg-cli');
const path = require('path');
const fs = require('fs-extra');

const AUDIO_ROOT = path.resolve(process.cwd(), '');
const ASSET_ROOT = path.resolve(process.cwd(), '');

const ENCODE = [
    {
        src: 'audioSrc',
        dest: 'dist/audio',
        opusTargetBitrate: '64k',
        mp3Quality: '6',
    },
];

// opus -  Opus (Opus Interactive Audio Codec) (decoders: opus libopus ) (encoders: opus libopus )
// mp3 - MP3 (MPEG audio layer 3) (decoders: mp3float mp3 ) (encoders: libmp3lame libshine mp3_mf )
async function main()
{
    for (const group of ENCODE)
    {
        const srcFolder = path.resolve(AUDIO_ROOT, group.src);
        if (!await fs.pathExists(srcFolder))
        {
            console.log(`** Source folder does not exist: ${srcFolder} **`);
            continue;
        }
        const destFolder = path.resolve(ASSET_ROOT, group.dest);

        await fs.ensureDir(destFolder);
        const files = await fs.readdir(srcFolder);

        for (const file of files)
        {
            if (!file.endsWith('.wav') && !file.endsWith('.ogg') && !file.endsWith('.mp3')) continue;
            const targetBase = path.resolve(destFolder, file.slice(0, -4));
            const targetOpus = targetBase + '.opus';
            const targetCaf = targetBase + '.caf';
            const targetMp3 = targetBase + '.mp3';
            if (await fs.pathExists(targetOpus) || await fs.pathExists(targetCaf) || await fs.pathExists(targetMp3))
            {
                console.log(`${file} - skipped, one or more outputs exists`);
                continue;
            }
            try
            {
                const result = await ffmpeg.run(`-n -i "${path.resolve(srcFolder, file)}" -c:a libopus -b:a ${group.opusTargetBitrate} "${targetCaf}" -c:a libopus -b:a ${group.opusTargetBitrate} "${targetOpus}" -c:a libmp3lame -q:a ${group.mp3Quality} "${targetMp3}"`);
                console.log(`${file} - encoded to opus,caf,mp3`);
                if (result)
                {
                    console.log(result);
                }
            }
            catch (e)
            {
                console.log('Error:\n', e);
            }
        }
    }
}

main();