from flask_wtf import Form
from wtforms import TextField, PasswordField
from wtforms.validators import DataRequired, EqualTo, Length


class RegisterForm(Form):
    '''define formats of fields used to add
    '''
    email = TextField(
        'Email',
        validators=[DataRequired(), Length(min=6, max=40)]
    )
    password = PasswordField(
        'Password',
        validators=[DataRequired(), Length(min=3, max=40)]
    )
    confirm = PasswordField(
        'Repeat Password',
        [DataRequired(), EqualTo('password', message='Passwords must match')]
    )

class LoginForm(Form):
    email = TextField('Username (E-mail)', [DataRequired()])
    password = PasswordField('Password', [DataRequired()])


class ForgotForm(Form):
    email = TextField(
        'Email', validators=[DataRequired(), Length(min=6, max=40)]
    )
