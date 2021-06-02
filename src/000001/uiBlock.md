## Ui 블록-컨테이너의 경량 대안
Phaser 컨테이너 대안
사용자로부터 많은 피드백을받는 게임 회사의 개발자로서 저는 사람들이 익숙한 기능에 대해 매우 열정을 가질 수 있음을 이해합니다.
일주일 전 Richard Davey (Phaser의 창시자)의이 공지를 보았을 때 제가 그런 열정의 희생양이 된 것 같습니다.
    이것은 중첩 된  컨테이너에 대한 지원 이 Phaser의 향후 버전 (3.12가 아닌 3.13)에서 제거 될 것이라는 문제를 추적하는 사람들을위한 경고 일뿐  입니다.
    컨테이너를 만들고 사용하는 기능은 그대로 유지되지만 더 이상 컨테이너를 다른 컨테이너의 하위로 추가 할 수 없습니다.
    https://github.com/photonstorm/phaser/issues/3852
나는이 결정을 이해하고지지하지만 해결해야 할 문제가 생겼습니다.


## Phaser 3의 그룹 및 컨테이너
플래시 배경에서 나는 영화 클립을 만들고 해당 클립 안에 다른 개체를 추가하는 데 익숙했습니다.
특히 사용자 인터페이스 구성 요소에 이것을 사용합니다. Phaser 2에서는 UI를 만들기 위해 그룹을 꽤 많이 사용합니다.

문제를 이해하려면 그룹과 컨테이너에 대해 조금 이해해야합니다. 최근에 그룹과 컨테이너에 대해 많은 혼란을 겪고 있습니다.
Phaser 2에서 오는 사람들에게는 특히 혼란 스럽습니다. Phaser 3의 그룹은 Phaser 2와 동일하게 작동하지 않습니다.

내가 본 일반적인 질문은 "왜 그룹을 그룹에 추가 할 수 없습니까?"입니다.
컨테이너 또는 그룹에 자식을 추가하면 어떻게되는지 살펴 보겠습니다.


## 그룹 작동 방식
다음은 장면에 4 개의 이미지를 추가하는 간단한 코드입니다. 그런 다음 각 그룹과 컨테이너에 2 개의 이미지를 추가합니다.
    create() {
        this.icon1 = this.add.image(100, 100, "icon1");
        this.icon2 = this.add.image(200, 200, "icon2");
        this.icon3 = this.add.image(300, 300, "icon3");
        this.icon4 = this.add.image(400, 400, "icon4");
        //
        //
        //
        this.con = this.add.container();
        this.group = this.add.group();
        //
        //
        this.con.add(this.icon1);
        this.con.add(this.icon2);
        //
        //
        this.group.add(this.icon3);
        this.group.add(this.icon4);
    }
이제 장면을 콘솔에 로그 아웃하면 이것이 결과입니다.
    https://media.publit.io/file/q_80/websiteImages/phasergames/children.png
보시다시피 이미지, icon3 및 4를 그룹에 추가했지만 여전히 장면의 표시 목록에 있습니다.
그룹은 목록에 전혀 표시되지 않습니다! Phaser 3에서 그룹은 게임 개체를 구성하는 데 사용됩니다.
물리 충돌을 위해 개체를 그룹화하거나 단순히 자식을 반복하는 쉬운 방법을 가질 수 있습니다.
Phaser 3 Sprites에서 이미지, 텍스트는 항상 장면의 자식입니다. 그것은 컨테이너를 제외하고 있습니다.


## 컨테이너 작동 방식
컨테이너에는 자체 표시 목록이 있습니다. 게임 오브젝트를 컨테이너에 추가하면 컨테이너 목록에 추가됩니다.
다음은 컨테이너의 출력입니다.
    https://media.publit.io/file/w_677,c_fit,q_80/websiteImages/phasergames/container.png
보시다시피 icon1과 icon2는 컨테이너 목록에 있습니다.
따라서 컨테이너의 내용을 변경하면 해당 변경 사항이 목록의 모든 하위 항목에 영향을줍니다.


## 그래서 무엇이 문제입니까?
컨테이너에 컨테이너를 추가하면 해당 컨테이너에 무한한 수의 컨테이너가 포함될 수 있기 때문에 코드 성능에 영향을 미치기 시작합니다.
Richard Davey의 말 :
    컨테이너는 중첩 될 수 있습니다. 즉, 하나의 컨테이너를 다른 컨테이너에 삽입하고 그에서 자식을 분기 할 수 있습니다.
    체인이 깊어 질수록 각 자식이 렌더링 할 때마다 트리를 루트로 다시 횡단하므로 모든 조회 비용이 더 많이 들기 때문에 권장하지 않습니다.
이것이 컨테이너 중첩을 제거하기에 충분한 문제를 일으킨 것입니다.


##  내 해결 방법
나는 이것이 모든 상황에서 컨테이너를 대체하는 역할을 할 의도가 없습니다.
그러나 제가 이야기 한 많은 개발자들은 컨테이너를 사용하여 UI를 만들고 있으며 이것이 현재 컨테이너를 사용하는 유일한 방법입니다.

위의 출력에서 ​​볼 수 있듯이 페이저 컨테이너에는 바디가 있습니다. 이는 물리를 컨테이너에 적용 할 수 있음을 의미합니다.
또한 UI에 필요하지 않은 변형, 각도 및 블렌드 모드와 같은 다른 많은 것들이 있습니다.
내가해야 할 일은 다른 좌표 집합을 기준으로 배치 할 수있는 요소 집합을 찾는 것입니다.
가시성을 설정하는 기능도 추가했습니다. 이러한 기능은 확장 할 수 있지만 지금은 이러한 기본 사항으로 충분합니다.

예를 들어 텍스트 버튼을 만들려면 텍스트 필드와 컨테이너 내부의 이미지를 결합합니다.
메시지 상자를 만들고 싶다고 말하면 다른 컨테이너를 만들어야합니다. 그런 다음 첫 번째 컨테이너 (버튼)를 두 번째 컨테이너 안에 넣어야합니다.

이 솔루션은 그 문제를 해결합니다. 한계가 있지만 내가 필요로하는 것이므로 도움이 되었기를 바랍니다.


## UIBlock 클래스
UIBlock 클래스는 그룹과 동일한 방식으로 하위를 무대에 둡니다.
또한 다음 루프 대신 연결 목록을 사용하여 위치를 업데이트하기 위해 자식을 통한 반복 속도를 높였습니다.
다른 모든 것은 기본적인 수학 일뿐입니다.
class UIBlock {
    constructor() {
        //init private variables
        this._x = 0;
        this._y = 0;
        //
        //
        //keep track of this block's previous position
        this._oldX = 0;
        this._oldY = 0;
        //
        //
        this._visible = true;
        //
        //
        //needs to be set by developer
        this._displayWidth = 0;
        this._displayHeight = 0;
        //
        //
        //an array of the children
        this.children = [];
        //current child count
        //used for indexing
        this.childIndex = -1;
        //
        //used to identify this as a UIBlock to another UIBlock
        this.isPosBlock = true;
    }
    set x(val) {
        //record the current x into oldX
        this._oldX = this._x;
        //
        //update the value
        this._x = val;
        //
        //update the children
        this.updatePositions();
    }
    set y(val) {
        //record the current y into oldY
        this._oldY = this._y;
        //
        //update the value
        this._y = val;
        //update the children
        this.updatePositions();
    }
    //getters
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    //add a child
    add(child) {
        //up the index
        this.childIndex++;
        //make a note of the index inside the child
        child.childIndex = this.childIndex;
        //add to the array
        this.children.push(child);
        //build the linked list
        this.buildList();
    }
    removeChild(child) {
        //take the child off the array based on index
        this.children.splice(child.childIndex, 1);
        //
        //rebuild the linked list
        this.buildList();
        //rebuild the indexes
        var len = this.children.length;
        for (var i = 0; i < len; i++) {
            this.children[i].childIndex = i;
        }
        //set the childIndex to the length of the array
        this.childIndex = len;
    }
    buildList() {
        var len = this.children.length;
        if (len > 1) {
            for (var i = 1; i < len; i++) {
                //set the current child to the previous child's nextChild property
                this.children[i - 1].nextChild = this.children[i];
            }
        }
        this.children[len - 1].nextChild = null;
    }
    get displayWidth() {
        return this._displayWidth;
    }
    get displayHeight() {
        return this._displayHeight;
    }
    setSize(w, h) {
        this._displayWidth = w;
        this._displayHeight = h;
    }
    setXY(x, y) {
        this.x = x;
        this.y = y;
        this.updatePositions();
    }
    set visible(val) {
        if (this._visible != val) {
            this._visible = val;
            if (this.children.length > 0) {
                //send the first child to the updateChildVisible function
                this.updateChildVisible(this.children[0], val);
            }
        }
    }
    get visible() {
        return this._visible;
    }
    updateChildVisible(child, vis) {
        child.visible = vis;
        if (child.isPosBlock == true) {
            child.visible = vis;
        }
        if (child.nextChild != null) {
            //if the child has a nextChild call this function recursively 
            this.updateChildVisible(child.nextChild, vis);
        }
    }
    updateChildPos(child) {
        child.y = child.y - this._oldY + this._y;
        child.x = child.x - this._oldX + this._x;
        if (child.isPosBlock == true) {
            child.updatePositions();
        }
        if (child.nextChild != null) {
            //if the child has a nextChild call this function recursively 
            this.updateChildPos(child.nextChild);
        }
        //set the old values to the new
        this._oldX = this._x;
        this._oldY = this._y;
    }
    updatePositions() {
        if (this.children.length > 0) {
            //send the first child to the updateChildPos function
            this.updateChildPos(this.children[0]);
        }
    }
    getRelPos(child) {
        return {
            x: child.x - this.x,
            y: child.y - this.y
        }
    }
}


## 용법
    class TextButton extends UIBlock {
        constructor(config) {
            super(config.scene);
            //add children
            }
    }
    var textButton=new TextButton({scene:this});

그러나 이런 식으로 사용할 수도 있습니다.
    var back = this.add.image(0, 0, "box");
    var back = this.add.image(0, 0, "box");
    var button = this.add.image(0, 50, "button");
    var text=this.add.text(0,-30,"Message Here",{color:'#ff0000'}).setOrigin(0.5,0.5);

    block=new UIBlock();

    block.add(back);
    block.add(button);
    block.add(text);

    block.x=240;
    block.y=300;


