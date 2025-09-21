#!/bin/bash

echo "测试输入处理..."

# 获取用户选择
get_choice() {
    while true; do
        echo -n "请输入您的选择 (1-6): "
        read choice
        
        # 去除可能的空白字符
        choice=$(echo "$choice" | tr -d '[:space:]')
        
        echo "调试: 输入=[$choice]"
        
        if [[ "$choice" =~ ^[1-6]$ ]]; then
            echo "匹配成功，返回: $choice"
            echo "$choice"
            return 0
        else
            echo "匹配失败"
            echo -e "\033[0;31m[ERROR]\033[0m 请输入 1 到 6 之间的数字"
            echo
        fi
    done
}

# 执行选择的脚本
run_script() {
    local choice=$1
    echo "run_script 收到选择: [$choice]"
    
    case "$choice" in
        1)
            echo "选择1"
            ;;
        2)
            echo "选择2"
            ;;
        3)
            echo "选择3"
            ;;
        4)
            echo "选择4"
            ;;
        5)
            echo "选择5"
            ;;
        6)
            echo "选择6 - 退出"
            echo -e "\033[0;34m[INFO]\033[0m 感谢使用，再见！"
            exit 0
            ;;
        *)
            echo -e "\033[0;31m[ERROR]\033[0m 无效的选择: [$choice]"
            exit 1
            ;;
    esac
}

# 主函数
main() {
    local choice
    choice=$(get_choice)
    echo "主函数收到选择: [$choice]"
    run_script "$choice"
}

main
