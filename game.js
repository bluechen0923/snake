/**
 * @class Game
 * @description 贪吃蛇游戏的主类
 */
class Game {
    /**
     * @constructor
     * @description 初始化游戏
     */
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20; // 网格大小
        
        // 初始化速度
        this.speed = 200;
        this.originalSpeed = this.speed;
        
        // 初始化蛇的属性
        this.snake = {
            body: [
                { x: 10, y: 10 }, // 蛇头
                { x: 9, y: 10 },  // 身体
                { x: 8, y: 10 }   // 尾巴
            ],
            direction: 'right'
        };
        
        // 初始化分数
        this.score = 0;
        
        // 游戏状态
        this.gameOver = false;
        this.isPaused = false;
        
        // 特效状态
        this.effects = {
            speed: false,
            double: false
        };
        
        // 食物属性设置
        this.foodTypes = {
            normal: {
                chance: 0.4,    // 40%概率
                score: 1,
                color: '#ff0000',
                duration: 0
            },
            star: {
                chance: 0.2,    // 20%概率
                score: 3,
                color: '#FFD700',
                duration: 10,
                effect: 'grow'
            },
            speed: {
                chance: 0.15,   // 15%概率
                score: 2,
                color: '#00ffff',
                duration: 5,
                effect: 'speed'
            },
            rainbow: {
                chance: 0.15,   // 15%概率
                score: 1,
                color: '#ff00ff',
                duration: 8,
                effect: 'double'
            },
            small: {
                chance: 0.1,    // 10%概率
                score: 2,
                color: '#32CD32',
                duration: 0,
                effect: 'shrink'
            },
            bomb: {
                chance: 0.05, // 5% 概率
                score: -5, // 吃到会扣分
                color: '#000000', // 黑色
                duration: 0,
                effect: 'none'
            }
        };
        
        // 食物系统
        this.food = this.generateFood('normal');
        this.foodType = 'normal';
        
        // 特殊食物倒计时
        this.specialFoodTimer = null;
        this.specialFoodDuration = 10; // 10秒
        this.specialFoodTimeLeft = 0;
        
        // 食物动画
        this.foodAnimationFrame = 0;
        this.foodAnimationInterval = setInterval(() => {
            this.foodAnimationFrame = (this.foodAnimationFrame + 1) % 30;
            if (!this.gameOver && !this.isPaused) {
                this.drawFood();
            }
        }, 50);
        
        // 音效设置
        this.soundEnabled = true;
        this.sounds = {
            eat: new Audio('sounds/eat.mp3'),
            die: new Audio('sounds/die.mp3'),
            move: new Audio('sounds/move.mp3')
        };

        // 最高分
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        this.updateHighScore();
        
        // 绑定键盘事件
        this.bindKeyEvents();
        
        // 绑定按钮事件
        this.bindButtons();
        
        // 移除自动开始游戏
        this.gameLoop = null;
        
        // 难度系统
        this.level = 1;
        this.baseSpeed = 200; // 基础速度
        this.speedIncreaseRate = 0.95; // 每升级速度变为原来的95%
        this.pointsPerLevel = 10; // 每10分升一级
        this.maxLevel = 10; // 最高10级
        
        // 更新显示
        this.updateLevel();
        
        // 成就系统
        this.achievements = {
            beginner: {
                id: 'ach-beginner',
                name: '初出茅庐',
                description: '达到3级',
                icon: '🌟',
                condition: () => this.level >= 3,
                unlocked: false
            },
            intermediate: {
                id: 'ach-intermediate',
                name: '小有成就',
                description: '达到5级',
                icon: '🏆',
                condition: () => this.level >= 5,
                unlocked: false
            },
            expert: {
                id: 'ach-expert',
                name: '登峰造极',
                description: '达到10级',
                icon: '👑',
                condition: () => this.level >= 10,
                unlocked: false
            },
            scorer: {
                id: 'ach-scorer',
                name: '得分王者',
                description: '获得50分',
                icon: '💯',
                condition: () => this.score >= 50,
                unlocked: false
            },
            collector: {
                id: 'ach-collector',
                name: '美食收集者',
                description: '吃到所有类型的食物',
                icon: '🍽️',
                condition: () => this.checkAllFoodTypesEaten(),
                unlocked: false
            }
        };
        
        // 已吃到的食物类型记录
        this.eatenFoodTypes = new Set();
        
        // 从本地存储加载成就状态
        this.loadAchievements();
        
        this.difficultyLevels = {
            easy: 200,
            medium: 150,
            hard: 100,
            extreme: 50, // 新增极难
            endless: 0   // 新增无尽模式
        };
        
        this.init();
    }

    /**
     * @method init
     * @description 初始化游戏设置
     */
    init() {
        this.clearCanvas();
        this.drawGrid();
        this.drawSnake();
        this.drawFood();
        this.updateScore();
    }

    /**
     * @method clearCanvas
     * @description 清空画布
     */
    clearCanvas() {
        this.ctx.fillStyle = '#146B3A';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * @method drawSnake
     * @description 绘制蛇
     */
    drawSnake() {
        this.snake.body.forEach((segment, index) => {
            if (index === 0) {
                // 蛇头 - 圆形
                this.ctx.fillStyle = '#FFD700'; // 金色蛇头
                const centerX = segment.x * this.gridSize + this.gridSize / 2;
                const centerY = segment.y * this.gridSize + this.gridSize / 2;
                
                this.ctx.beginPath();
                this.ctx.arc(
                    centerX,
                    centerY,
                    this.gridSize / 2 - 1,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
                
                // 绘制蛇眼
                this.ctx.fillStyle = '#800080'; // 紫色眼睛
                const eyeSize = 4;
                const eyeOffset = 3;
                
                this.drawEyes(segment, centerX, centerY, eyeSize);
            } else if (index === this.snake.body.length - 1) {
                // 蛇尾 - 三角形
                const tailX = segment.x * this.gridSize;
                const tailY = segment.y * this.gridSize;
                const prevSegment = this.snake.body[this.snake.body.length - 2];
                
                // 计算尾巴朝向
                const direction = {
                    x: segment.x - prevSegment.x,
                    y: segment.y - prevSegment.y
                };
                
                this.ctx.fillStyle = `hsl(${(index * 25) % 360}, 100%, 70%)`;
                this.ctx.beginPath();
                
                // 调整三角形大小
                const margin = 4; // 边距
                const size = this.gridSize - margin * 2; // 减小三角形整体大小
                
                if (direction.x > 0) { // 尾巴朝右
                    this.ctx.moveTo(tailX + margin, tailY + margin);
                    this.ctx.lineTo(tailX + margin, tailY + size + margin);
                    this.ctx.lineTo(tailX + size + margin, tailY + size/2 + margin);
                } else if (direction.x < 0) { // 尾巴朝左
                    this.ctx.moveTo(tailX + size + margin, tailY + margin);
                    this.ctx.lineTo(tailX + size + margin, tailY + size + margin);
                    this.ctx.lineTo(tailX + margin, tailY + size/2 + margin);
                } else if (direction.y > 0) { // 尾巴朝下
                    this.ctx.moveTo(tailX + margin, tailY + margin);
                    this.ctx.lineTo(tailX + size + margin, tailY + margin);
                    this.ctx.lineTo(tailX + size/2 + margin, tailY + size + margin);
                } else { // 尾巴朝上
                    this.ctx.moveTo(tailX + margin, tailY + size + margin);
                    this.ctx.lineTo(tailX + size + margin, tailY + size + margin);
                    this.ctx.lineTo(tailX + size/2 + margin, tailY + margin);
                }
                
                this.ctx.closePath();
                this.ctx.fill();
            } else {
                // 蛇身 - 彩虹渐变
                const hue = (index * 25) % 360;
                this.ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
                this.ctx.fillRect(
                    segment.x * this.gridSize,
                    segment.y * this.gridSize,
                    this.gridSize - 2,
                    this.gridSize - 2
                );
            }
        });
    }

    /**
     * @method drawEyes
     * @description 绘制蛇的眼睛
     */
    drawEyes(segment, x, y, size) {
        const centerX = segment.x * this.gridSize + this.gridSize / 2;
        const centerY = segment.y * this.gridSize + this.gridSize / 2;
        const radius = size/2;
        
        // 根据方向调整眼睛位置
        let leftEye, rightEye;
        
        switch(this.snake.direction) {
            case 'right':
                leftEye = { x: centerX + 4, y: centerY - 4 };
                rightEye = { x: centerX + 4, y: centerY + 4 };
                break;
            case 'left':
                leftEye = { x: centerX - 4, y: centerY - 4 };
                rightEye = { x: centerX - 4, y: centerY + 4 };
                break;
            case 'up':
                leftEye = { x: centerX - 4, y: centerY - 4 };
                rightEye = { x: centerX + 4, y: centerY - 4 };
                break;
            case 'down':
                leftEye = { x: centerX - 4, y: centerY + 4 };
                rightEye = { x: centerX + 4, y: centerY + 4 };
                break;
        }
        
        // 绘制左眼
        this.ctx.beginPath();
        this.ctx.arc(leftEye.x, leftEye.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制右眼
        this.ctx.beginPath();
        this.ctx.arc(rightEye.x, rightEye.y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * @method bindKeyEvents
     * @description 绑定键盘事件
     */
    bindKeyEvents() {
        document.addEventListener('keydown', (e) => {
            // 阻止空格键的默认行为
            if (e.key === ' ') {
                e.preventDefault();
            }
            
            switch(e.key) {
                case 'ArrowUp':
                    if (this.snake.direction !== 'down') {
                        this.snake.direction = 'up';
                    }
                    break;
                case 'ArrowDown':
                    if (this.snake.direction !== 'up') {
                        this.snake.direction = 'down';
                    }
                    break;
                case 'ArrowLeft':
                    if (this.snake.direction !== 'right') {
                        this.snake.direction = 'left';
                    }
                    break;
                case 'ArrowRight':
                    if (this.snake.direction !== 'left') {
                        this.snake.direction = 'right';
                    }
                    break;
                case ' ': // 空格键
                    this.togglePause();
                    break;
            }
        });
    }

    /**
     * @method generateFood
     * @description 生成新的食物位置
     * @param {string} type - 食物类型
     * @returns {{x: number, y: number, type: string}} 食物的坐标和类型
     */
    generateFood(forceType = null) {
        const maxX = this.canvas.width / this.gridSize - 1;
        const maxY = this.canvas.height / this.gridSize - 1;
        
        // 决定食物类型
        let selectedType = forceType;
        if (!selectedType) {
            const rand = Math.random();
            let accumulatedChance = 0;
            selectedType = 'normal';
            
            for (const [type, props] of Object.entries(this.foodTypes)) {
                accumulatedChance += props.chance;
                if (rand < accumulatedChance) {
                    selectedType = type;
                    break;
                }
            }
        }
        
        // 生成食物位置
        while (true) {
            const food = {
                x: Math.floor(Math.random() * maxX),
                y: Math.floor(Math.random() * maxY),
                type: selectedType
            };
            
            if (!this.snake.body.some(segment => 
                segment.x === food.x && segment.y === food.y)) {
                
                // 如果是特殊食物，启动倒计时
                if (this.foodTypes[selectedType].duration > 0) {
                    this.startSpecialFoodTimer();
                }
                
                return food;
            }
        }
    }

    /**
     * @method startSpecialFoodTimer
     * @description 启动特殊食物倒计时
     */
    startSpecialFoodTimer() {
        // 清除现有的定时器
        if (this.specialFoodTimer) {
            clearInterval(this.specialFoodTimer);
        }
        
        this.specialFoodTimeLeft = this.specialFoodDuration;
        
        this.specialFoodTimer = setInterval(() => {
            if (!this.isPaused && !this.gameOver) {
                this.specialFoodTimeLeft--;
                
                if (this.specialFoodTimeLeft <= 0) {
                    // 时间到，生成新的普通食物
                    clearInterval(this.specialFoodTimer);
                    this.food = this.generateFood('normal');
                }
            }
        }, 1000);
    }

    /**
     * @method drawFood
     * @description 绘制食物
     */
    drawFood() {
        const centerX = (this.food.x * this.gridSize) + (this.gridSize / 2);
        const centerY = (this.food.y * this.gridSize) + (this.gridSize / 2);
        const pulseScale = 1 + Math.sin(this.foodAnimationFrame * 0.2) * 0.1;
        
        this.ctx.fillStyle = this.foodTypes[this.food.type].color;
        
        switch(this.food.type) {
            case 'star':
                this.drawStar(centerX, centerY, 5,
                    (this.gridSize / 2 - 2) * pulseScale,
                    (this.gridSize / 4 - 1) * pulseScale);
                break;
            case 'speed':
                this.drawLightning(centerX, centerY, this.gridSize * pulseScale);
                break;
            case 'rainbow':
                this.drawRainbow(centerX, centerY, this.gridSize * pulseScale);
                break;
            case 'small':
                this.drawSmall(centerX, centerY, this.gridSize * pulseScale);
                break;
            default:
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY,
                    (this.gridSize / 2 - 2) * pulseScale, 0, Math.PI * 2);
                this.ctx.fill();
        }
        
        // 显示倒计时
        if (this.foodTypes[this.food.type].duration > 0) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `${this.specialFoodTimeLeft}s`,
                centerX,
                centerY - this.gridSize
            );
        }
    }

    /**
     * @method drawStar
     * @description 绘制星形
     */
    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let x = cx;
        let y = cy;
        let step = Math.PI / spikes;

        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius;
            y = cy + Math.sin(rot) * outerRadius;
            this.ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerRadius;
            y = cy + Math.sin(rot) * innerRadius;
            this.ctx.lineTo(x, y);
            rot += step;
        }

        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * @method checkCollision
     * @description 检查碰撞
     * @returns {boolean} 是否发生碰撞
     */
    checkCollision() {
        const head = this.snake.body[0];
        
        // 检查是否撞墙
        if (head.x < 0 || head.x >= this.canvas.width / this.gridSize ||
            head.y < 0 || head.y >= this.canvas.height / this.gridSize) {
            return true;
        }
        
        // 检查是否撞到自己
        for (let i = 1; i < this.snake.body.length; i++) {
            if (head.x === this.snake.body[i].x && 
                head.y === this.snake.body[i].y) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * @method updateScore
     * @description 更新分数显示
     */
    updateScore() {
        document.getElementById('score').textContent = this.score;
    }

    /**
     * @method gameOverHandler
     * @description 处理游戏结束
     */
    gameOverHandler() {
        this.gameOver = true;
        clearInterval(this.gameLoop);
        
        // 渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 游戏结束文字
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            '游戏结束!',
            this.canvas.width / 2,
            this.canvas.height / 2 - 40
        );
        
        // 分数显示
        this.ctx.font = '24px Arial';
        this.ctx.fillText(
            `最终得分: ${this.score}`,
            this.canvas.width / 2,
            this.canvas.height / 2
        );
        
        if (this.score === this.highScore && this.score > 0) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(
                '新纪录！',
                this.canvas.width / 2,
                this.canvas.height / 2 + 30
            );
        }
        
        // 重新开始提示
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(
            '按"开始新游戏"重新开始',
            this.canvas.width / 2,
            this.canvas.height / 2 + 70
        );
    }

    /**
     * @method bindButtons
     * @description 绑定按钮事件
     */
    bindButtons() {
        // 开始按钮
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startNewGame();
        });

        // 暂停按钮
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.togglePause();
        });

        // 难度选择
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.speed = this.difficultyLevels[e.target.value] || this.baseSpeed;
            if (this.gameLoop) {
                clearInterval(this.gameLoop);
                this.gameLoop = setInterval(() => this.update(), this.speed);
            }
        });

        // 声音按钮
        document.getElementById('soundBtn').addEventListener('click', () => {
            this.soundEnabled = !this.soundEnabled;
            document.getElementById('soundBtn').textContent = 
                `声音：${this.soundEnabled ? '开' : '关'}`;
        });
    }

    /**
     * @method startNewGame
     * @description 开始新游戏
     */
    startNewGame() {
        // 重置游戏状态
        this.snake = {
            body: [
                { x: 10, y: 10 },
                { x: 9, y: 10 },
                { x: 8, y: 10 }
            ],
            direction: 'right'
        };
        
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.food = this.generateFood();
        
        // 清除现有的游戏循环
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        
        // 开始新的游戏循环
        this.gameLoop = setInterval(() => this.update(), this.speed);
        
        // 更新按钮文本
        document.getElementById('pauseBtn').textContent = '暂停';
        
        // 初始化游戏界面
        this.init();
        
        // 清除特殊食物定时器
        if (this.specialFoodTimer) {
            clearInterval(this.specialFoodTimer);
            this.specialFoodTimer = null;
        }
        
        // 重置难度相关
        this.level = 1;
        this.speed = this.baseSpeed;
        this.updateLevel();
        
        // 重置已吃到的食物类型记录
        this.eatenFoodTypes.clear();
    }

    /**
     * @method togglePause
     * @description 切换游戏暂停状态
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pauseBtn');
        pauseBtn.textContent = this.isPaused ? '继续' : '暂停';
    }

    /**
     * @method drawGrid
     * @description 绘制网格背景
     */
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        // 绘制垂直线
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // 绘制水平线
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * @method playSound
     * @description 播放音效
     * @param {string} soundName - 音效名称
     */
    playSound(soundName) {
        if (this.soundEnabled && this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(() => {});
        }
    }

    /**
     * @method updateHighScore
     * @description 更新最高分显示
     */
    updateHighScore() {
        document.getElementById('highScore').textContent = this.highScore;
    }

    /**
     * @method updateLevel
     * @description 更新等级显示
     */
    updateLevel() {
        document.getElementById('level').textContent = this.level;
    }

    /**
     * @method calculateLevel
     * @description 根据分数计算等级和速度
     */
    calculateLevel() {
        const newLevel = Math.min(
            Math.floor(this.score / this.pointsPerLevel) + 1,
            this.maxLevel
        );

        if (newLevel !== this.level) {
            this.level = newLevel;
            this.updateLevel();

            // 动态调整速度
            if (this.speed > 0) { // 只有在非无尽模式下调整速度
                const speedMultiplier = Math.pow(this.speedIncreaseRate, this.level - 1);
                this.speed = this.baseSpeed * speedMultiplier;

                // 更新游戏循环
                if (this.gameLoop) {
                    clearInterval(this.gameLoop);
                    this.gameLoop = setInterval(() => this.update(), this.speed);
                }
            }
            // 显示等级提升提示
            this.showLevelUpMessage();
        }
    }

    /**
     * @method showLevelUpMessage
     * @description 显示等级提升消息
     */
    showLevelUpMessage() {
        // 保存当前状态
        const currentFillStyle = this.ctx.fillStyle;
        const currentFont = this.ctx.font;
        const currentTextAlign = this.ctx.textAlign;
        
        // 绘制等级提升消息
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `升级！当前等级 ${this.level}`,
            this.canvas.width / 2,
            50
        );
        
        // 恢复状态
        this.ctx.fillStyle = currentFillStyle;
        this.ctx.font = currentFont;
        this.ctx.textAlign = currentTextAlign;
        
        // 3秒后消失
        setTimeout(() => {
            this.clearCanvas();
            this.drawGrid();
            this.drawSnake();
            this.drawFood();
        }, 1000);
    }

    /**
     * @method update
     * @description 更新游戏状态
     */
    update() {
        if (this.gameOver || this.isPaused) return;
        
        const head = { ...this.snake.body[0] };
        
        // 根据方向移动蛇头
        switch(this.snake.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        this.playSound('move');
        
        // 在头部添加新的位置
        this.snake.body.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.playSound('eat');
            
            const foodProps = this.foodTypes[this.food.type];
            let scoreIncrease = foodProps.score;
            
            // 如果有双倍得分效果
            if (this.effects.double) {
                scoreIncrease *= 2;
            }
            
            this.score += scoreIncrease;
            
            // 处理特殊效果
            if (foodProps.effect) {
                this.handleFoodEffect(this.food.type);
            }
            
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('snakeHighScore', this.highScore);
                this.updateHighScore();
            }
            this.updateScore();
            
            // 生成新的食物
            this.food = this.generateFood();
            
            // 计算新的等级
            this.calculateLevel();
            
            // 记录吃到的食物类型
            this.eatenFoodTypes.add(this.food.type);
            
            // 检查成就
            this.checkAchievements();
        } else {
            // 如果没有吃到食物，移除尾部
            this.snake.body.pop();
        }
        
        // 检查碰撞
        if (this.checkCollision()) {
            this.playSound('die');
            this.gameOverHandler();
            return;
        }
        
        // 重新绘制
        this.clearCanvas();
        this.drawGrid();
        this.drawSnake();
        this.drawFood();
    }

    /**
     * @method handleFoodEffect
     * @description 处理食物效果
     */
    handleFoodEffect(type) {
        const foodProps = this.foodTypes[type];
        
        switch(foodProps.effect) {
            case 'grow':
                // 增加两个额外的身体段
                const tail = this.snake.body[this.snake.body.length - 1];
                this.snake.body.push({...tail}, {...tail});
                break;
            case 'speed':
                this.effects.speed = true;
                this.speed = this.originalSpeed * 0.7; // 提速30%
                setTimeout(() => {
                    this.effects.speed = false;
                    this.speed = this.originalSpeed;
                }, foodProps.duration * 1000);
                break;
            case 'double':
                this.effects.double = true;
                setTimeout(() => {
                    this.effects.double = false;
                }, foodProps.duration * 1000);
                break;
            case 'shrink':
                // 缩短蛇的长度，但保持最小长度为3
                const minLength = 3;
                const currentLength = this.snake.body.length;
                if (currentLength > minLength) {
                    this.snake.body = this.snake.body.slice(0, currentLength - 2);
                }
                break;
        }
    }

    /**
     * @method destroy
     * @description 在组件销毁时清理
     */
    destroy() {
        clearInterval(this.gameLoop);
        clearInterval(this.foodAnimationInterval);
        if (this.specialFoodTimer) {
            clearInterval(this.specialFoodTimer);
        }
    }

    /**
     * @method drawLightning
     * @description 绘制闪电形状
     */
    drawLightning(cx, cy, size) {
        const s = size * 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(cx - s/4, cy - s/2);
        this.ctx.lineTo(cx + s/4, cy - s/4);
        this.ctx.lineTo(cx - s/4, cy + s/4);
        this.ctx.lineTo(cx + s/4, cy + s/2);
        this.ctx.fill();
    }

    /**
     * @method drawRainbow
     * @description 绘制彩虹效果
     */
    drawRainbow(cx, cy, size) {
        const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, size/2);
        gradient.addColorStop(0, '#ff0000');
        gradient.addColorStop(0.2, '#ff8000');
        gradient.addColorStop(0.4, '#ffff00');
        gradient.addColorStop(0.6, '#00ff00');
        gradient.addColorStop(0.8, '#0000ff');
        gradient.addColorStop(1, '#8000ff');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, size/2 - 2, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * @method drawSmall
     * @description 绘制缩小箭头
     */
    drawSmall(cx, cy, size) {
        const s = size * 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - s/2);
        this.ctx.lineTo(cx + s/2, cy);
        this.ctx.lineTo(cx, cy + s/2);
        this.ctx.lineTo(cx - s/2, cy);
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * @method loadAchievements
     * @description 从本地存储加载成就状态
     */
    loadAchievements() {
        const savedAchievements = localStorage.getItem('snakeAchievements');
        if (savedAchievements) {
            const unlockedAchievements = JSON.parse(savedAchievements);
            unlockedAchievements.forEach(id => {
                const achievement = Object.values(this.achievements)
                    .find(a => a.id === id);
                if (achievement) {
                    achievement.unlocked = true;
                    this.updateAchievementDisplay(achievement.id, true);
                }
            });
        }
    }

    /**
     * @method saveAchievements
     * @description 保存成就状态到本地存储
     */
    saveAchievements() {
        const unlockedAchievements = Object.values(this.achievements)
            .filter(a => a.unlocked)
            .map(a => a.id);
        localStorage.setItem('snakeAchievements', JSON.stringify(unlockedAchievements));
    }

    /**
     * @method checkAchievements
     * @description 检查所有成就的完成状态
     */
    checkAchievements() {
        Object.values(this.achievements).forEach(achievement => {
            if (!achievement.unlocked && achievement.condition()) {
                this.unlockAchievement(achievement);
            }
        });
    }

    /**
     * @method unlockAchievement
     * @description 解锁成就并显示提示
     */
    unlockAchievement(achievement) {
        achievement.unlocked = true;
        this.updateAchievementDisplay(achievement.id, true);
        this.showAchievementPopup(achievement);
        this.saveAchievements();
    }

    /**
     * @method updateAchievementDisplay
     * @description 更新成就显示状态
     */
    updateAchievementDisplay(id, unlocked) {
        const achievementElement = document.getElementById(id);
        if (achievementElement) {
            const iconElement = achievementElement.querySelector('.achievement-icon');
            iconElement.textContent = unlocked ? 
                this.achievements[id.replace('ach-', '')].icon : '🔒';
            iconElement.className = `achievement-icon ${unlocked ? 'unlocked' : 'locked'}`;
        }
    }

    /**
     * @method showAchievementPopup
     * @description 显示成就解锁提示
     */
    showAchievementPopup(achievement) {
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
            <div class="icon">${achievement.icon}</div>
            <div class="text">
                <div class="title">解锁成就！</div>
                <div>${achievement.name}</div>
            </div>
        `;
        
        document.body.appendChild(popup);
        
        // 3秒后移除提示
        setTimeout(() => {
            popup.remove();
        }, 3000);
    }

    /**
     * @method checkAllFoodTypesEaten
     * @description 检查是否吃到了所有类型的食物
     */
    checkAllFoodTypesEaten() {
        const allFoodTypes = Object.keys(this.foodTypes);
        return allFoodTypes.every(type => this.eatenFoodTypes.has(type));
    }

    /**
     * @method draw
     * @description 绘制游戏元素
     */
    draw() {
        this.clearCanvas();
        this.drawGrid();
        this.drawSnake();
        this.drawFood();
    }
}

// 当页面加载完成后创建游戏实例
window.onload = () => {
    const game = new Game();
}; 