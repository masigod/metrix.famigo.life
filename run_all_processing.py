#!/usr/bin/env python3
"""
K-Beauty 패널 데이터 통합 처리 스크립트
모든 데이터 처리 과정을 순차적으로 실행합니다.
"""

import subprocess
import sys
import os
from datetime import datetime
import time

# 색상 코드 정의
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(message):
    """헤더 메시지 출력"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{message}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")

def print_step(step_num, message):
    """단계 메시지 출력"""
    print(f"{Colors.OKCYAN}{Colors.BOLD}[Step {step_num}] {message}{Colors.ENDC}")

def print_success(message):
    """성공 메시지 출력"""
    print(f"{Colors.OKGREEN}✅ {message}{Colors.ENDC}")

def print_error(message):
    """에러 메시지 출력"""
    print(f"{Colors.FAIL}❌ {message}{Colors.ENDC}")

def print_warning(message):
    """경고 메시지 출력"""
    print(f"{Colors.WARNING}⚠️  {message}{Colors.ENDC}")

def check_file_exists(filepath):
    """파일 존재 여부 확인"""
    if os.path.exists(filepath):
        print_success(f"파일 확인: {os.path.basename(filepath)}")
        return True
    else:
        print_error(f"파일 없음: {filepath}")
        return False

def run_script(script_name, step_num, description):
    """개별 Python 스크립트 실행"""
    print_step(step_num, description)

    try:
        # 스크립트 실행
        result = subprocess.run(
            [sys.executable, script_name],
            capture_output=True,
            text=True,
            check=True
        )

        # 성공 메시지만 출력 (상세 로그는 생략)
        print_success(f"{description} 완료!")

        # 주요 결과만 파싱하여 출력
        if "최종 파일:" in result.stdout:
            for line in result.stdout.split('\n'):
                if "최종 파일:" in line or "출력 파일:" in line:
                    print(f"  {Colors.OKBLUE}→ {line.strip()}{Colors.ENDC}")

        return True

    except subprocess.CalledProcessError as e:
        print_error(f"{description} 실패!")
        print(f"{Colors.FAIL}에러 내용:{Colors.ENDC}")
        print(e.stderr)
        return False
    except FileNotFoundError:
        print_error(f"스크립트를 찾을 수 없습니다: {script_name}")
        return False

def main():
    """메인 실행 함수"""

    # 시작 시간 기록
    start_time = datetime.now()

    print_header("K-Beauty 패널 데이터 통합 처리 시작")
    print(f"실행 시간: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"작업 디렉토리: {os.getcwd()}")

    # 필수 입력 파일 확인
    print(f"\n{Colors.BOLD}[사전 점검] 필수 파일 확인{Colors.ENDC}")

    required_files = [
        'source/K-Beauty_Skin_Care_Panel_Data_1.csv',
        'source/K-Beauty_Skin_Care_Panel_Data_2.csv',
        'source/K-Beauty_Skin_Care_Panel_Data_3.csv',
        'source/famigo_member_Sep_23_2025_1_final_cleaned.csv'
    ]

    all_files_exist = True
    for file in required_files:
        if not check_file_exists(file):
            all_files_exist = False

    if not all_files_exist:
        print_error("필수 파일이 없습니다. 처리를 중단합니다.")
        return False

    print_success("모든 필수 파일 확인 완료!")

    # 처리 단계 정의
    processing_steps = [
        {
            'script': 'merge_csv_files.py',
            'description': 'CSV 파일 통합 및 중복 제거',
            'output': 'source/K-Beauty_Panel_Integrated.csv'
        },
        {
            'script': 'cross_check_data.py',
            'description': 'Famigo 데이터와 크로스 체킹',
            'output': 'source/K-Beauty_Panel_Integrated_with_Match.csv'
        },
        {
            'script': 'convert_to_english_columns.py',
            'description': '컬럼명 영어 변환',
            'output': 'source/K-Beauty_Panel_Airtable_Ready.csv'
        },
        {
            'script': 'normalize_data.py',
            'description': '데이터 정규화',
            'output': 'source/K-Beauty_Panel_Normalized.csv'
        }
    ]

    # 각 단계 실행
    print(f"\n{Colors.BOLD}[처리 시작] 총 {len(processing_steps)}개 단계{Colors.ENDC}")

    for i, step in enumerate(processing_steps, 1):
        print(f"\n{'-'*60}")

        # 스크립트 실행
        success = run_script(step['script'], i, step['description'])

        if not success:
            print_error(f"Step {i}에서 오류 발생. 처리를 중단합니다.")
            return False

        # 출력 파일 확인
        if not check_file_exists(step['output']):
            print_error(f"예상 출력 파일이 생성되지 않았습니다: {step['output']}")
            return False

        # 다음 단계 전 잠시 대기
        time.sleep(1)

    # 완료 시간 계산
    end_time = datetime.now()
    duration = end_time - start_time

    # 최종 결과 요약
    print_header("처리 완료!")

    print(f"{Colors.BOLD}📊 최종 결과:{Colors.ENDC}")
    print(f"  • 시작 시간: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  • 완료 시간: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  • 소요 시간: {duration.total_seconds():.2f}초")

    print(f"\n{Colors.BOLD}📁 생성된 최종 파일:{Colors.ENDC}")
    print(f"  {Colors.OKGREEN}• source/K-Beauty_Panel_Normalized.csv{Colors.ENDC}")
    print(f"    → Airtable 업로드용 최종 파일")

    print(f"\n{Colors.BOLD}📋 다음 단계:{Colors.ENDC}")
    print("  1. K-Beauty_Panel_Normalized.csv 파일을 Airtable에 업로드")
    print("  2. AIRTABLE_SCHEMA.md 문서 참조하여 필드 매핑 확인")
    print("  3. 데이터 검증 및 View 설정")

    print(f"\n{Colors.OKGREEN}{Colors.BOLD}✨ 모든 처리가 성공적으로 완료되었습니다!{Colors.ENDC}")

    return True

def run_specific_step(step_number):
    """특정 단계만 실행"""
    steps = {
        1: ('merge_csv_files.py', 'CSV 파일 통합 및 중복 제거'),
        2: ('cross_check_data.py', 'Famigo 데이터와 크로스 체킹'),
        3: ('convert_to_english_columns.py', '컬럼명 영어 변환'),
        4: ('normalize_data.py', '데이터 정규화')
    }

    if step_number in steps:
        script, description = steps[step_number]
        print_header(f"단계 {step_number} 실행: {description}")
        return run_script(script, step_number, description)
    else:
        print_error(f"잘못된 단계 번호: {step_number}")
        return False

if __name__ == "__main__":
    # 명령행 인자 처리
    if len(sys.argv) > 1:
        if sys.argv[1] == '--help' or sys.argv[1] == '-h':
            print("""
사용법:
  python run_all_processing.py          # 모든 단계 실행
  python run_all_processing.py [1-4]    # 특정 단계만 실행
  python run_all_processing.py --help   # 도움말

단계:
  1: CSV 파일 통합 및 중복 제거
  2: Famigo 데이터와 크로스 체킹
  3: 컬럼명 영어 변환
  4: 데이터 정규화
            """)
        else:
            try:
                step = int(sys.argv[1])
                run_specific_step(step)
            except ValueError:
                print_error("단계 번호는 1-4 사이의 숫자여야 합니다.")
    else:
        # 전체 프로세스 실행
        success = main()
        sys.exit(0 if success else 1)