이 튜토리얼에서는 레트로 스타일의 최고 점수 테이블을 만들 것입니다.
고전적인 아케이드 게임은 종종 최고 점수를 얻기 위해 최선을 다해야하지만, 단순한 3 자 이름으로 최고 점수 테이블에서 불멸화합니다.

우리는 이것을 어떤 게임에도 쉽게 놓을 수있는 Phaser 3 씬에서 재현 할 것입니다.
그러나 복고풍에서 영감을 받았지만 우리는 완전히 과거에 얽매이고 싶지 않습니다.
따라서 커서 키를 사용하여 최고 점수 테이블에 입력 할 문자를 선택할 수있을뿐만 아니라 마우스를 사용하거나 입력을 터치하거나 간단히 입력 할 수도 있습니다.


## 장면 구조
최고 점수 테이블에 이름을 입력하는 장면을 만들 것입니다.
이 장면을라고 부르지 InputPanel만 실제로 원하는대로 이름을 지정할 수 있습니다.
아이디어는 게임이 끝날 때 Game Over Scene이 입력 패널의 인스턴스를 시작한다는 것입니다.

이 패널은 Game Over Scene과 병렬로 실행됩니다. 상호 작용하면 이벤트가 발생합니다.
Game Over Scene은 이러한 이벤트를 수신하고 그에 따라 응답합니다.
이름 입력을 마치면 Game Over Scene이 패널을 닫고 모든 권한을 다시 시작합니다.

이제 구조부터 시작하겠습니다.


## 파트 2-최고 점수 장면
http://phaser.io/content/tutorials/retro-highscore-table/panel.png
마침표 문자 및 하이픈과 함께 선택할 수있는 표준 문자 A에서 Z가 있습니다. RUB 아이콘은 한 글자를 지우고 END는 이름을 범례에 적용합니다.

위의 스크린 샷에서 문자 A 주위의 블록은 현재 어떤 문자가 끝나고 있는지 보여주는 가이드입니다.
포인터를 그 위로 이동하면 현재 마우스를 올려 놓은 문자를 추적하도록 변경됩니다. 마찬가지로 커서 키를 눌러도 이동할 수 있습니다.

패널을 구성 해 봅시다.

패널의 문자는 BMFont 도구 와 트루 타입 글꼴을 사용하여 만든 비트 맵 글꼴에서 가져옵니다 .
http://www.angelcode.com/products/bmfont/

http://phaser.io/content/tutorials/retro-highscore-table/font.png
물론이 글꼴을 사용해도되지만 다른 글꼴로 바꿀 수도 있습니다. 그렇게한다면 코드에서 좌표를 조정해야하지만 어디를 표시하기 위해 주석을 달았습니다.

다른 스프라이트 (블록, RUB 및 END)는 글꼴에 맞는 크기로 만든 단순한 PNG입니다.
이 예제에서는 단순히 자산을로드하고 입력 판에서 이벤트를 수신하는 Highscore Scene을 만들 것입니다. 다음은 전체 수업입니다.
class Highscore extends Phaser.Scene { ... }

사전로드에서는 필요한 자산을 가져옵니다.
create에서 테이블 범례 (Rank, Score, Name)를 표시하기 위해 Bitmap Text 객체를 추가 한 다음 playerText라는 새 Bitmap Text를 만듭니다.
이것은 사용자가 입력하는 이름을 담을 텍스트입니다.

마지막으로 InputPanel Scene을 시작하고 여기에서 두 가지 이벤트를 수신합니다.
첫 번째, updateName은 사용자가 문자를 입력하거나 삭제할 때마다 트리거됩니다.
이런 일이 발생하면 새 이름을 표시하도록 playerText 비트 맵 텍스트를 업데이트하기 만하면됩니다.

완료되면 submitName 이벤트가 트리거됩니다.
위의 예제 코드에서 입력 패널 장면을 중지하고 사용자 아래에 몇 가지 점수 만 더 표시합니다. 실제 게임에서는 여기서 원하는대로 할 수 있습니다.

다음 단계에서는 입력 판을 만들 것입니다.


## Part 2 - The Input Panel
입력 판 클래스 구성을 시작하겠습니다.

먼저 각 문자 사이에 20 픽셀 간격으로 비트 맵 텍스트를 그려서 선택할 수있는 문자를 만듭니다. 10 자 뒤에는 새 줄로 래핑합니다.
class inputPanel extends Phaser.Scene { ... }

위의 코드에서 비트 맵 텍스트와 몇 개의 이미지를 장면에 추가합니다.
아직 아무것도 선택할 수 없습니다. 이를 위해 텍스트 객체에서 pointermove 이벤트를 수신하고이를 수신 할 때이 새 함수를 실행 해 보겠습니다.
moveBlock (pointer, x, y)

우리의 텍스트 문자는 52 x 64 픽셀 간격으로 떨어져 있으므로 입력 좌표를 가져 와서 그리드 크기에 맞춘 다음 클릭 한 문자를 알아낼 수 있습니다.
그런 다음 클릭 할 때 발생하는 작업을 처리하는 함수가 필요합니다.
pressKey ()

위의 함수는 pointerup 이벤트에서 호출됩니다.
커서 값을 가져 와서 클릭 한 문자에 따라 submitName 이벤트 또는 updateName 이벤트를 내 보내서 클릭 한 문자를 확인합니다.
우리의 Highscore 클래스는 이러한 이벤트를 기다리고 있습니다. 함께 연결하면 다음을 얻을 수 있습니다.

위의 데모에서 어떻게 주위를 클릭하고 문자를 선택하여 나타나게 할 수 있는지 주목하십시오.
지금까지의 전체 수업은 다음과 같습니다.
class inputPanel extends Phaser.Scene { ... }

다음으로 키보드 컨트롤을 추가합니다.


## Part 4 - Keyboard Control
키보드 입력을 허용하기 위해 다음 키를 수신합니다.
    this.input.keyboard.on('keyup_LEFT', this.moveLeft, this);
    this.input.keyboard.on('keyup_RIGHT', this.moveRight, this);
    this.input.keyboard.on('keyup_UP', this.moveUp, this);
    this.input.keyboard.on('keyup_DOWN', this.moveDown, this);
    this.input.keyboard.on('keyup_ENTER', this.pressKey, this);
    this.input.keyboard.on('keyup_SPACE', this.pressKey, this);

위의 코드는 Input Panel 클래스의 생성 기능에 추가되었습니다.
따라하기가 꽤 쉬워야합니다. 정의 된 키에 대한 keyup 이벤트가 적중되면 moveLeft 또는 pressKey와 같은 다양한 핸들러를 호출합니다.
이러한 기능 중 하나를 살펴 보겠습니다.
    moveLeft() {
        if (this.cursors.x > 0) {
            this.cursors.x--;
            this.block.x -= 52;
        } else {
            this.cursors.x = 9;
            this.block.x += 52 * 9;
        }
    }

왼쪽 커서 키를 누르면 커서가 왼쪽으로 이동합니다.
커서가 이미 x 위치 인 0에있는 경우, 이제 최고점 입력 테이블의 맨 오른쪽에 있도록 커서를 둘러 쌉니다.
이 동일한 개념이 모든 방향에 사용됩니다. 위쪽 커서를 누르고 맨 위 행에 있으면 맨 아래 행으로 둘러싸 이는 식입니다.
마지막으로 ENTER와 SPACE 키를 이전에 만든 pressKey 함수에 연결했습니다.
즉, 해당 키 중 하나를 누르면 현재 활성 문자가 이름 항목에 추가됩니다.
포인터 위로 이벤트가 사용하는 것과 똑같은 기능을 사용할 수 있습니다.


## Part 5 - Text Input