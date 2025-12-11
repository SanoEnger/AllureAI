import ast

from schemas import ValidationIssue, ValidationReport

from loguru import logger

logger.add("logs/app.log", rotation="500 MB", retention="10 days")

class TestCaseValidator(ast.NodeVisitor):
    def __init__(self) -> None:
        self.issues: list[ValidationIssue] = []
        self.has_import_allure = False
        self.test_functions: list[ast.FunctionDef] = []
        self.aaa_steps_found = {"Arrange": False, "Act": False, "Assert": False}
        self.decorators_found: set[str] = set()

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            if alias.name == "allure":
                self.has_import_allure = True
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        if node.module == "allure":
            self.has_import_allure = True
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef):
        if node.name.startswith("test_"):
            self.test_functions.append(node)
            for dec in node.decorator_list:
                if isinstance(dec, ast.Attribute):
                    self.decorators_found.add(dec.attr)
                elif isinstance(dec, ast.Name):
                    self.decorators_found.add(dec.id)
        self.generic_visit(node)

    def visit_With(self, node: ast.With):
        for item in node.items:
            ctx_expr = item.context_expr
            if isinstance(ctx_expr, ast.Call) and isinstance(ctx_expr.func, ast.Attribute):
                if isinstance(ctx_expr.func.value, ast.Name) and ctx_expr.func.value.id == "allure":
                    if ctx_expr.func.attr == "step" and ctx_expr.args:
                        first_arg = ctx_expr.args[0]
                        if isinstance(first_arg, ast.Constant) and isinstance(first_arg.value, str):
                            if first_arg.value in self.aaa_steps_found:
                                self.aaa_steps_found[first_arg.value] = True
        self.generic_visit(node)


def validate_testcase(code: str) -> ValidationReport:
    issues: list[ValidationIssue] = []

    try:
        tree = ast.parse(code)
    except SyntaxError as exc:
        issues.append(
            ValidationIssue(
                code="syntax_error",
                message=str(exc),
                line=exc.lineno,
                column=exc.offset,
                severity="error",
            )
        )
        return ValidationReport(is_valid=False, issues=issues, stats={})

    validator = TestCaseValidator()
    validator.visit(tree)

    if not validator.has_import_allure:
        issues.append(
            ValidationIssue(
                code="missing_import_allure",
                message="Не найден import allure",
                line=None,
                column=None,
                severity="error",
            )
        )

    if not validator.test_functions:
        issues.append(
            ValidationIssue(
                code="no_test_functions",
                message="Не найдено ни одной функции test_*",
                line=None,
                column=None,
                severity="error",
            )
        )

    required_decorators = {"feature", "story", "title", "tag", "label"}
    for dec in required_decorators:
        if dec not in validator.decorators_found:
            issues.append(
                ValidationIssue(
                    code=f"missing_allure_{dec}",
                    message=f"Не найден декоратор allure.{dec}",
                    line=None,
                    column=None,
                    severity="warning",
                )
            )

    for step, found in validator.aaa_steps_found.items():
        if not found:
            issues.append(
                ValidationIssue(
                    code=f"missing_step_{step.lower()}",
                    message=f"Не найден шаг AAA: {step}",
                    line=None,
                    column=None,
                    severity="warning",
                )
            )

    is_valid = not any(i.severity == "error" for i in issues)
    stats = {
        "test_functions_count": len(validator.test_functions),
        "has_import_allure": validator.has_import_allure,
        "decorators_found": sorted(list(validator.decorators_found)),
        "aaa_steps": validator.aaa_steps_found,
    }

    return ValidationReport(is_valid=is_valid, issues=issues, stats=stats)
