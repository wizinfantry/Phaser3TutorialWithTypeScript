##  타워 디펜스 게임 만들기 게임
시작할 시간입니다. 먼저 기본 씬으로 빈 Phaser 3 프로젝트를 만듭니다. 장면에 대해 다음 기능을 구현해야합니다.

preload – 여기에 리소스를로드합니다. 여기서는 하나의 아틀라스와 하나의 이미지를 만듭니다.
create  - 여기에서 게임 로직을 만듭니다.
update  – 여기에서 게임을 업데이트합니다.
D:\PROJECT\JAVASCRIPT\PHASER\TEST003\src\000001\towerGame.ts

타워 디펜스 게임에서 적들은 경로를 따라 이동합니다.
이러한 이유로 우리는 매우 간단한 경로 요소를 만들 것입니다.
create function을 다음과 같이 변경하십시오.
D:\PROJECT\JAVASCRIPT\PHASER\TEST003\src\000001\towerGame.ts

이제 브라우저에서 게임을 실행하면 다음과 같은 내용이 표시됩니다.
https://gamedevacademy.org/wp-content/uploads/2018/05/tdscreen1.png.webp

이 튜토리얼에서는 정말 간단한 경로를 사용하고 있지만 약간 실험하고 다른 곡선을 사용할 수 있습니다.
이제 적을 만들 차례입니다. 이를 위해 Phaser 3 Image 클래스를 확장합니다.
create 함수 앞에 다음 코드를 추가 합니다.

이것은 우리의 빈 Enemy 클래스입니다. 이제 여기에 몇 가지 논리를 추가해야합니다.
오브젝트가 경로를 따라 가도록하는 방법에 대한 기본 아이디어를 얻을 수 있도록 경로 추종자 부분을 분리하기로 결정했습니다.
이러한 이유로 각 적에는 두 개의 매개 변수가있는 추종자 객체가 있습니다.
t는 0에서 시작까지의 경로 진행률을 표시합니다.
-끝과 vec (Phaser.Math.Vector2 ())는 주어진 좌표의 x 및 y 좌표를 얻습니다.
t 포인트. Enemy 생성자 끝에 다음 행을 추가합니다.
    startOnPath(): void {...}

startOnPath 메서드는 경로의 첫 번째 지점에 적을 배치합니다.
이제 Enemy의 업데이트 방법을 다음과 같이 변경하십시오.
    update(time: number, delta: number) {....}

ENEMY_SPEED는 현재 다음과 같이 정의됩니다.
    const ENEMY_SPEED = 1/10000;

특정 시점에서 각 적 유형이 서로 다른 속도를 갖기를 원하지만 지금은 전역 변수를 사용합니다.
이제 게임에 적 그룹을 추가하고 create function 끝에 아래 코드를 추가합니다 .
    this.enemies = this.add.group({classType: ememy, runChildUpdate: true});
    this.nextEnemy = 0;

장면 업데이트 기능을 다음과 같이 변경하십시오.
    update(time: number, delta: number) {....}

지금 게임을 실행하면 다음과 같은 내용이 표시됩니다.
https://gamedevacademy.org/wp-content/uploads/2018/05/tdscreen2.png.webp

좋아요, 우리는 적이 있습니다. 이제 우리를 방어 할 때입니다. 먼저 그래픽에 그리드를 그려 포탑을 배치 할 수있는 위치를 명확히합니다.
다음은 drawGrid 함수입니다.
    drawGrid(graphics: Phaser.GameObjects.Graphics) {....}

다음과 같이 create 함수를 시작할 때 drawGrid를 호출합니다.
    this.drawGrid(this.add.graphics());

Turret 클래스는 같은 방식으로 Image를 확장합니다. 차이점은 포탑은 움직이지 않지만 X 초마다 특정 동작 (사격)을 실행한다는 것입니다.
다음은 Turret 클래스입니다. 적 바로 뒤에 배치 할 수 있습니다.
D:\PROJECT\JAVASCRIPT\PHASER\TEST003\src\000001\towerTurret.ts

이제 터렛 그룹을 생성합니다. 만들기 함수 끝에 다음 코드를 추가합니다.
    this.turrets = this.add.group({classType: Turret, runChildUpdate: true});

게임에 포탑을 추가하기 위해 포인터 다운 사용자 입력에 함수를 추가합니다. 생성 기능 끝에 다음을 추가하십시오.
    this.input.on('pointerdown', this.placeTurret, this);

다음은 placeTurret 함수입니다.
    placeTurret(pointer: {x: number, y: number}): void {....}

그리고 여기 canPlaceTurret이 있습니다 .
    canPlaceTurret(i: number, j: number): boolean {....}

여기에서는 배열을 사용하여 터렛을 배치하려는 장소가 비어 있는지 확인합니다.
포탑을 배치 할 때 값을 1로 설정했습니다. 경로 요소는 -1로 미리 정의되어 있습니다.

이제 브라우저에서 게임을 실행하면 다음과 같은 내용이 표시됩니다.
https://gamedevacademy.org/wp-content/uploads/2018/05/tdscreen3.png.webp

게임을 클릭하고 장소가 비어 있으면 터렛을 배치 할 수 있습니다. 하지만 우리 포탑은 꽤 유휴 상태입니다.
적들에게 아무 일도하지 않습니다. 그들을 쏘고 죽일 시간입니다. 우리는 적과 포탑과 같은 방식으로 총알을 만들 것입니다.
D:\PROJECT\JAVASCRIPT\PHASER\TEST003\src\000001\towerBullet.ts

그리고 create 함수 끝에 다음 행을 추가합니다.
    this.bullets = this.add.group({classType: Bullet, runChildUpdate: true});

이제 포탑이 총알을 쏠 필요가있을 때 사용할 함수를 만들 것입니다.
이 함수는 x, y 및 포탑과 적 사이의 각도라는 세 가지 매개 변수를 얻습니다. 이 함수는 동일한 매개 변수로 bullet.fire를 호출합니다.
    addBullet(x: number, y: number, angle: number): void {....}

그리고 포탑이 작동하게하려면 기능이 하나 더 필요합니다. 적절한 적을 집어 들고 돌려 보냅니다.
우리의 경우에는 포탑 근처에있는 적군의 첫 번째 적입니다. 조금 플레이하고 함수가 가장 가까운 적을 얻도록 만들 수 있습니다.
포탑 근처에 적이 없으면 거짓을 반환합니다. 이 함수는 Phaser.Math.Distance.Between을 사용하여 두 지점 사이의 거리를 계산합니다.
    getEnemy(x: number, y: number, distance: number): any {....}

getEnemy에서는 적 그룹의 자식에 대해 반복하고 자식이 활성 상태인지 테스트 한 다음 거리가 세 번째 매개 변수보다 작은 지 테스트합니다.

이제 총알을 쏘기 위해이 두 가지 기능을 사용하도록 터렛을 변경해야합니다. 업데이트 방법을 다음과 같이 변경하십시오.

이제 fire 메서드를 만들어야합니다.
getEnemy 함수를 통해 적을받습니다.
그런 다음 포탑과 적 사이의 각도를 계산하고이 각도로 addBullet을 호출합니다.
그런 다음 포탑을이 적을 향해 회전합니다. 포탑 이미지가 위를 향하고 있기 때문에 각도를 약간 조정해야합니다.
그리고 Image 클래스의 각도가도 단위이므로 현재 값에 Phaser.Math.RAD_TO_DEG를 곱해야합니다.

다음 코드를 Turret 클래스에 추가합니다.