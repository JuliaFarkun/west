import Card from './Card.js';
import Game from './Game.js';
import TaskQueue from './TaskQueue.js';
import SpeedRate from './SpeedRate.js';

// Отвечает является ли карта уткой.
function isDuck(card) {
    return card && card.quacks && card.swims;
}

// Отвечает является ли карта собакой.
function isDog(card) {
    return card instanceof Dog;
}

// Дает описание существа по схожести с утками и собаками
function getCreatureDescription(card) {
    if (isDuck(card) && isDog(card)) {
        return 'Утка-Собака';
    }
    if (isDuck(card)) {
        return 'Утка';
    }
    if (isDog(card)) {
        return 'Собака';
    }
    return 'Существо';
}

// Базовый тип для всех существ в игре.
class Creature extends Card {
    getDescriptions() {
        return [getCreatureDescription(this), ...super.getDescriptions()];
    }
}

// Основа для утки.
class Duck extends Creature {
    constructor(name = 'Мирная утка', power = 2) {
        super(name, power);
    }

    quacks() { 
        console.log('quack'); 
    }

    swims() { 
        console.log('float: both;'); 
    }
}


// Основа для собаки.
class Dog extends Creature {
    constructor(name = 'Пес-бандит', power = 3) {
        super(name, power);
    }
}

// Браток — чем их больше, тем они сильнее.
class Lad extends Dog {
    constructor(name = 'Браток', power = 2) {
        super(name, power);
    }

    static getInGameCount() {
        return this.inGameCount || 0;
    }

    static setInGameCount(value) {
        this.inGameCount = value;
    }

    static getBonus() {
        const n = this.getInGameCount();
        return (n * (n + 1)) / 2;
    }

    doAfterComingIntoPlay(gameContext, continuation) {
        Lad.setInGameCount(Lad.getInGameCount() + 1);
        gameContext.updateView();
        continuation();
    }

    doBeforeRemoving(continuation) {
        Lad.setInGameCount(Math.max(0, Lad.getInGameCount() - 1));
        continuation();
    }

    modifyDealedDamageToCreature(value, toCard, gameContext, continuation) {
        continuation(value + Lad.getBonus());
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        continuation(Math.max(value - Lad.getBonus(), 0));
    }

    getDescriptions() {
        const descriptions = [...super.getDescriptions()];
        const hasDamageMods = Lad.prototype.hasOwnProperty('modifyDealedDamageToCreature')
            || Lad.prototype.hasOwnProperty('modifyTakenDamage');
        if (hasDamageMods) {
            descriptions.unshift('Чем их больше, тем они сильнее');
        }
        return descriptions;
    }
}

// Громила — собака, которая получает на 1 меньше урона.
class Trasher extends Dog {
    constructor(name = 'Громила', power = 5) {
        super(name, power);
    }

    modifyTakenDamage(value, fromCard, gameContext, continuation) {
        if (value <= 0) {
            continuation(value);
            return;
        }

        const reducedValue = Math.max(value - 1, 0);
        if (reducedValue === value) {
            continuation(value);
            return;
        }

        this.view.signalAbility(() => continuation(reducedValue));
    }

    getDescriptions() {
        return ['Получает на 1 меньше урона', ...super.getDescriptions()];
    }
}

// Гатлинг — наносит по 2 урона всем картам противника на столе (по очереди).
class Gatling extends Creature {
    constructor(name = 'Гатлинг', power = 6) {
        super(name, power);
    }

    attack(gameContext, continuation) {
        const taskQueue = new TaskQueue();
        const { oppositePlayer } = gameContext;

        taskQueue.push((onDone) => this.view.showAttack(onDone));

        const cards = [...oppositePlayer.table];
        for (const card of cards) {
            if (!card) {
                continue;
            }
            taskQueue.push((onDone) => this.dealDamageToCreature(2, card, gameContext, onDone));
        }

        taskQueue.continueWith(continuation);
    }
}


const seriffStartDeck = [
    new Duck(),
    new Duck(),
    new Duck(),
];
const banditStartDeck = [
    new Lad(),
    new Lad(),
];

// Создание игры.
const game = new Game(seriffStartDeck, banditStartDeck);

// Глобальный объект, позволяющий управлять скоростью всех анимаций.
SpeedRate.set(1);

// Запуск игры.
game.play(false, (winner) => {
    alert('Победил ' + winner.name);
});
