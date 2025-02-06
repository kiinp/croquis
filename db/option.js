const { app } = require('electron');
const fs = require('fs');
const path = require('path');

class Option {
    constructor() {
        this.filePath = path.join(app.getPath("userData"), 'option.json');
        /** @type {import('../src/type').GlobalOption} */
        this.option = {
            rootDirectory: '',
            language: 'en',
            theme: 'light',
            screenScale: 100,
            croquis: {},
        };
        this.init();
    }
    init() {
        const option = this.readOptionJson();
        if(option){
            this.setOption(option);
        }
    }
    readOptionJson() {
        try {
            const data = fs.readFileSync(this.filePath, 'utf-8'); // 파일 읽기
            return JSON.parse(data); // JSON 문자열을 객체로 변환
        } catch (err) {
            console.error('Error reading JSON file:', err);
            return null;
        }
    }
    setOption(option) {
        Object.keys(this.option).forEach((key) => {
            if (option && option[key]) {
                this.option[key] = option[key];
            }
        })
        this.saveOptionJson();
    }
    saveOptionJson() {
        try {
            const jsonData = JSON.stringify(this.option, null, 4); // 객체를 JSON 문자열로 변환 (들여쓰기 4칸)
            fs.writeFileSync(this.filePath, jsonData, 'utf-8'); // 파일 저장
            console.log('JSON file saved successfully.');
        } catch (err) {
            console.error('Error saving JSON file:', err);
        }
    }
}

module.exports = Option;