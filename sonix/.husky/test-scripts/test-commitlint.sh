#!/bin/bash

# Test script for commitlint configuration
# This script validates that commit messages follow the required format:
# <type>(<JIRA-ID>): <subject>

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Function to test a commit message
test_commit() {
    local message="$1"
    local should_pass="$2"
    local description="$3"
    
    echo -e "\n${YELLOW}Testing:${NC} $description"
    echo "Message: \"$message\""
    
    if echo "$message" | npx commitlint --quiet 2>/dev/null; then
        if [ "$should_pass" = "true" ]; then
            echo -e "${GREEN}✓ PASS${NC} - Correctly accepted"
            ((PASSED++))
        else
            echo -e "${RED}✗ FAIL${NC} - Should have been rejected but was accepted"
            ((FAILED++))
        fi
    else
        if [ "$should_pass" = "false" ]; then
            echo -e "${GREEN}✓ PASS${NC} - Correctly rejected"
            ((PASSED++))
        else
            echo -e "${RED}✗ FAIL${NC} - Should have been accepted but was rejected"
            echo "Error details:"
            echo "$message" | npx commitlint 2>&1 | grep "✖"
            ((FAILED++))
        fi
    fi
}

echo "========================================="
echo "  Commitlint Configuration Test Suite"
echo "========================================="

# ===== VALID COMMITS =====
echo -e "\n${YELLOW}=== VALID COMMIT MESSAGES ===${NC}"

test_commit "feat(DMS-123): add vendor management API endpoint" \
    "true" \
    "feat type with valid JIRA ID"

test_commit "fix(PROJ-456): resolve location sync timeout issue" \
    "true" \
    "fix type with different JIRA project"

test_commit "chore(DMS-789): upgrade NestJS dependencies to v11" \
    "true" \
    "chore type with valid JIRA ID"

test_commit "doc(DOC-100): update API authentication guide section" \
    "true" \
    "doc type with valid JIRA ID"

test_commit "refact(DMS-999): extract address validation logic module" \
    "true" \
    "refact type with valid JIRA ID"

test_commit "ux(UI-555): improve dashboard button styling and layout" \
    "true" \
    "ux type with valid JIRA ID"

test_commit "tool(TOOL-222): configure biome linting rules for project" \
    "true" \
    "tool type with valid JIRA ID"

test_commit "minor(DMS-111): update README with installation steps" \
    "true" \
    "minor type with valid JIRA ID"

test_commit "feat(ABC123-999): add feature with alphanumeric JIRA project" \
    "true" \
    "JIRA ID with alphanumeric project code"

# ===== INVALID COMMITS - Missing JIRA ID =====
echo -e "\n${YELLOW}=== INVALID: Missing JIRA ID ===${NC}"

test_commit "feat: add vendor management API" \
    "false" \
    "Missing JIRA ID in scope"

test_commit "fix: resolve timeout issue" \
    "false" \
    "Missing JIRA ID (fix type)"

# ===== INVALID COMMITS - Wrong JIRA Format =====
echo -e "\n${YELLOW}=== INVALID: Wrong JIRA Format ===${NC}"

test_commit "feat(123): add vendor API endpoint here" \
    "false" \
    "JIRA ID missing project prefix"

test_commit "feat(ids-123): add vendor management API" \
    "false" \
    "JIRA ID project code in lowercase"

test_commit "feat(IDS123): add vendor management API endpoint" \
    "false" \
    "JIRA ID missing hyphen separator"

test_commit "feat(DMS-): add vendor management API endpoint" \
    "false" \
    "JIRA ID missing ticket number"

test_commit "feat(INVALID): add vendor management API" \
    "false" \
    "JIRA ID with text instead of number"

# ===== INVALID COMMITS - Wrong Type =====
echo -e "\n${YELLOW}=== INVALID: Wrong Type ===${NC}"

test_commit "feature(DMS-123): add vendor management API" \
    "false" \
    "Wrong type: 'feature' instead of 'feat'"

test_commit "bugfix(DMS-123): resolve location sync timeout" \
    "false" \
    "Wrong type: 'bugfix' instead of 'fix'"

test_commit "docs(DMS-123): update API authentication guide" \
    "false" \
    "Wrong type: 'docs' instead of 'doc'"

test_commit "style(DMS-123): improve button styling" \
    "false" \
    "Wrong type: 'style' not in allowed list"

# ===== INVALID COMMITS - Wrong Case =====
echo -e "\n${YELLOW}=== INVALID: Wrong Case ===${NC}"

test_commit "Feat(DMS-123): add vendor management API" \
    "false" \
    "Type with uppercase first letter"

test_commit "FEAT(DMS-123): add vendor management API" \
    "false" \
    "Type in all uppercase"

test_commit "feat(DMS-123): Add vendor management API" \
    "false" \
    "Subject starting with uppercase letter"

# ===== INVALID COMMITS - Subject Too Short =====
echo -e "\n${YELLOW}=== INVALID: Subject Too Short ===${NC}"

test_commit "feat(DMS-123): add API" \
    "false" \
    "Subject less than 10 characters"

test_commit "fix(DMS-456): bug fix" \
    "false" \
    "Subject too short (8 chars)"

# ===== INVALID COMMITS - Format Issues =====
echo -e "\n${YELLOW}=== INVALID: Format Issues ===${NC}"

test_commit "feat (DMS-123): add vendor management API" \
    "false" \
    "Space before scope parentheses"

test_commit "feat(DMS-123) : add vendor management API" \
    "false" \
    "Space before colon"

test_commit "feat(DMS-123):add vendor management API endpoint" \
    "false" \
    "Missing space after colon"

test_commit "Added vendor management API" \
    "false" \
    "No type or JIRA ID at all"

# ===== PRINT SUMMARY =====
echo -e "\n========================================="
echo "  Test Results Summary"
echo "========================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo "Total:  $((PASSED + FAILED))"
echo "========================================="

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
