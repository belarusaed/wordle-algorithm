const _ = require("lodash");
const wl = _.shuffle(require('./wl.json'));
const readlineSync = require("readline-sync");

const positions = [
    {correct: null, wrong: []},
    {correct: null, wrong: []},
    {correct: null, wrong: []},
    {correct: null, wrong: []},
    {correct: null, wrong: []}
]
const letters = {black: [], yellow: [], green: []};

/*
 * Levels:
 *  0. Знайсці слова, якое не змяшчае ніводнай выкарыстанай літары, а таксама не паўтарае літары ў сабе
 *  1. Знайсці слова, якое не змяшчае ніводнай выкарыстанай літары, але можна паўтараць літары ў сабе
 *  2. Знайсці слова, якое змяшчае ў сабе найменшую колькасць жоўтых літар, але каб яны знаходзіліся ў новых пазіцыях
 *  3. Знайсці слова, якое змяшчае ў сабе найменшую кольксць ужо выкарыстаных літар
*/
function findNextWord(level = 0) {
    if (level === 0) {
        const result = wl.find(word => {
            if ([...letters.black, ...letters.yellow, ...letters.green].map(letter => word.includes(letter)).includes(true)) return false;
            if (_.isEqual(word, _.uniq(word.split('')).join(''))) return true;
            return false;
        });
        if (!result) return findNextWord(level + 1);
        return [result, level];
    }
    if (level === 1) {
        const result = wl.find(word => ![...letters.black, ...letters.yellow, ...letters.green].map(letter => word.includes(letter)).includes(true));
        if (!result) return findNextWord(level + 1);
        return [result, level];
    }
    if (level === 2) {
        let result;
        let maxLettersCount = 1;
        while (!result && maxLettersCount <= 5) {
            result = wl.find(word => {
                if ([...letters.black, ...letters.green].map(letter => word.includes(letter)).includes(true)) return false;
                let lettersCount = 0;
                for (const letter of letters.yellow) {
                    const position = word.search(letter)
                    if (position > -1) {
                        lettersCount += 1;
                        if (positions[position].wrong.includes(letter)) return false;
                    }
                    if (lettersCount > maxLettersCount) return false;
                }
                return lettersCount <= maxLettersCount;
            });
            maxLettersCount++;
        }
        if (!result) return findNextWord(level + 1);
        return [result, level];
    }
    if (level === 3) {
        let result;
        let maxLettersCount = 1;
        while (!result && maxLettersCount <= 5) {
            result = wl.find(word => {
                let lettersCount = 0;
                for (const letter of letters.yellow) {
                    if (word.includes(letter)) lettersCount += 1;
                    if (lettersCount > maxLettersCount) return false;
                }
                return lettersCount <= maxLettersCount;
            });
            maxLettersCount++;
        }
        if (!result) return findNextWord(level + 1);
        return [result, level];
    }
    return null;
}

const getPossibleAnswers = () => wl.filter(word => {
    let isValid = true;
    for (let index = 0; index < 5; index++) {
        if (positions[index].correct && word[index] !== positions[index].correct) isValid = false;
        if ([...positions[index].wrong, ...letters.black].includes(word[index])) isValid = false;
    }
    for (const yellowLetter of letters.yellow) if (!word.includes(yellowLetter)) isValid = false;
    return isValid;
});

if (require.main === module) {
    let currentWord = findNextWord();
    let i = 0;
    while (currentWord && i < 5 && getPossibleAnswers().length > 1) {
        console.log(currentWord[0]);
        let result = readlineSync.question('Напішыце колеры літар, выкарыстоўваючы B для чорнага, Y для жоўната, G для зялёнага, напрыклад: BYBBG. ').trim().toUpperCase();
        while (result.length > 5 || !'BGYBY'.includes(_.uniq(result).sort().join(''))) result = readlineSync.question('Адказ незразумелы, паспрабуйце яшчэ раз: ').trim().toUpperCase();
        result.split('').forEach((color, index) => {
            if (color === 'B' && !letters.black.includes(currentWord[0][index])) letters.black.push(currentWord[0][index]);
            if (color === 'Y') {
                if (!letters.yellow.includes(currentWord[0][index])) letters.yellow.push(currentWord[0][index]);
                if (!positions[index].wrong.includes(currentWord[0][index])) positions[index].wrong.push(currentWord[0][index])
            }
            if (color === 'G') {
                if (!letters.green.includes(currentWord[0][index])) letters.green.push(currentWord[0][index]);
                positions[index].correct = currentWord[0][index];
            }
        });
        currentWord = findNextWord(currentWord[1]);
        i++;
    }

    console.log('Магчымая правільныя адказы:', getPossibleAnswers().join(', '))
}