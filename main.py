"""
簡單的 Python 遊戲示例
使用 Pygame 製作
"""

import pygame
import sys
import random

# 初始化 Pygame
pygame.init()

# 遊戲設置
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
FPS = 60

# 顏色定義
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)

# 創建遊戲窗口
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("簡單遊戲 - Simple Game")

# 時鐘物件
clock = pygame.time.Clock()

# 玩家類
class Player(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        self.image = pygame.Surface((50, 50))
        self.image.fill(GREEN)
        self.rect = self.image.get_rect()
        self.rect.center = (SCREEN_WIDTH // 2, SCREEN_HEIGHT - 50)
        self.speed = 5

    def update(self):
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT] and self.rect.left > 0:
            self.rect.x -= self.speed
        if keys[pygame.K_RIGHT] and self.rect.right < SCREEN_WIDTH:
            self.rect.x += self.speed

    def draw(self, surface):
        surface.blit(self.image, self.rect)

# 敵人類
class Enemy(pygame.sprite.Sprite):
    def __init__(self):
        super().__init__()
        self.image = pygame.Surface((40, 40))
        self.image.fill(RED)
        self.rect = self.image.get_rect()
        self.rect.x = random.randint(0, SCREEN_WIDTH - self.rect.width)
        self.rect.y = random.randint(-100, -40)
        self.speed = random.randint(2, 6)

    def update(self):
        self.rect.y += self.speed
        if self.rect.top > SCREEN_HEIGHT:
            self.reset()

    def reset(self):
        self.rect.x = random.randint(0, SCREEN_WIDTH - self.rect.width)
        self.rect.y = random.randint(-100, -40)
        self.speed = random.randint(2, 6)

    def draw(self, surface):
        surface.blit(self.image, self.rect)

# 主遊戲循環
def main():
    running = True
    player = Player()
    enemies = [Enemy() for _ in range(5)]
    score = 0
    font = pygame.font.Font(None, 36)

    while running:
        clock.tick(FPS)

        # 事件處理
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False

        # 更新
        player.update()
        for enemy in enemies:
            enemy.update()

        # 碰撞檢測
        for enemy in enemies:
            if player.rect.colliderect(enemy.rect):
                enemy.reset()
                score += 10

        # 繪製
        screen.fill(BLUE)
        player.draw(screen)
        for enemy in enemies:
            enemy.draw(screen)

        # 顯示分數
        score_text = font.render(f"Score: {score}", True, WHITE)
        screen.blit(score_text, (10, 10))

        pygame.display.flip()

    pygame.quit()
    sys.exit()

if __name__ == "__main__":
    main()
